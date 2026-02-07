from elasticsearch import Elasticsearch
from django.conf import settings


def get_es_client():
    return Elasticsearch([settings.ELASTICSEARCH_URL])


def create_product_index():
    es = get_es_client()
    index_name = 'products'
    
    if es.indices.exists(index=index_name):
        return
    
    mapping = {
        'mappings': {
            'properties': {
                'product_id': {'type': 'integer'},
                'variant_id': {'type': 'integer'},
                'sku': {'type': 'keyword'},
                'name': {
                    'type': 'text',
                    'analyzer': 'standard',
                    'fields': {
                        'keyword': {'type': 'keyword'}
                    }
                },
                'slug': {'type': 'keyword'},
                'description': {'type': 'text'},
                'brand': {
                    'type': 'text',
                    'fields': {
                        'keyword': {'type': 'keyword'}
                    }
                },
                'category': {
                    'type': 'text',
                    'fields': {
                        'keyword': {'type': 'keyword'}
                    }
                },
                'category_path': {'type': 'keyword'},
                'price': {'type': 'float'},
                'in_stock': {'type': 'boolean'},
                'stock_quantity': {'type': 'integer'},
                'attributes': {
                    'type': 'nested',
                    'properties': {
                        'name': {'type': 'keyword'},
                        'value': {'type': 'keyword'}
                    }
                },
                'rating': {'type': 'float'},
                'review_count': {'type': 'integer'},
                'is_active': {'type': 'boolean'},
                'created_at': {'type': 'date'}
            }
        },
        'settings': {
            'number_of_shards': 1,
            'number_of_replicas': 0,
            'analysis': {
                'analyzer': {
                    'autocomplete': {
                        'tokenizer': 'autocomplete',
                        'filter': ['lowercase']
                    }
                },
                'tokenizer': {
                    'autocomplete': {
                        'type': 'edge_ngram',
                        'min_gram': 2,
                        'max_gram': 10,
                        'token_chars': ['letter', 'digit']
                    }
                }
            }
        }
    }
    
    es.indices.create(index=index_name, body=mapping)


def index_product(product):
    from catalog.models import Variant
    from django.db.models import Avg
    
    es = get_es_client()
    index_name = 'products'
    
    brand_name = product.brand.name if product.brand else ''
    category_name = product.category.name
    
    avg_rating = product.reviews.filter(is_approved=True).aggregate(Avg('rating'))['rating__avg']
    review_count = product.reviews.filter(is_approved=True).count()
    
    if product.has_variants:
        for variant in product.variants.filter(is_active=True):
            attributes = []
            for attr_value in variant.attribute_values.all():
                attributes.append({
                    'name': attr_value.attribute.slug,
                    'value': attr_value.value
                })
            
            doc = {
                'product_id': product.id,
                'variant_id': variant.id,
                'sku': variant.sku,
                'name': product.name,
                'slug': product.slug,
                'description': product.description,
                'brand': brand_name,
                'category': category_name,
                'category_path': category_name,
                'price': float(variant.effective_price),
                'in_stock': variant.stock_quantity > 0,
                'stock_quantity': variant.stock_quantity,
                'attributes': attributes,
                'rating': float(avg_rating) if avg_rating else 0,
                'review_count': review_count,
                'is_active': product.is_active and variant.is_active,
                'created_at': product.created_at.isoformat()
            }
            
            es.index(index=index_name, id=f"v_{variant.id}", document=doc)
    else:
        attributes = []
        for attr_value in product.attribute_values.all():
            attributes.append({
                'name': attr_value.attribute.slug,
                'value': attr_value.value
            })
        
        doc = {
            'product_id': product.id,
            'variant_id': None,
            'sku': f"PROD-{product.id}",
            'name': product.name,
            'slug': product.slug,
            'description': product.description,
            'brand': brand_name,
            'category': category_name,
            'category_path': category_name,
            'price': float(product.base_price),
            'in_stock': True,
            'stock_quantity': 999,
            'attributes': attributes,
            'rating': float(avg_rating) if avg_rating else 0,
            'review_count': review_count,
            'is_active': product.is_active,
            'created_at': product.created_at.isoformat()
        }
        
        es.index(index=index_name, id=f"p_{product.id}", document=doc)


def delete_product_from_index(product_id):
    es = get_es_client()
    index_name = 'products'
    
    query = {
        'query': {
            'term': {
                'product_id': product_id
            }
        }
    }
    
    es.delete_by_query(index=index_name, body=query)


def search_products(query, filters=None, page=1, page_size=20, sort_by='_score'):
    es = get_es_client()
    index_name = 'products'
    
    search_query = {
        'bool': {
            'must': [
                {
                    'multi_match': {
                        'query': query,
                        'fields': ['name^3', 'description', 'brand^2', 'category'],
                        'fuzziness': 'AUTO'
                    }
                }
            ],
            'filter': [
                {'term': {'is_active': True}}
            ]
        }
    }
    
    if filters:
        if 'category' in filters:
            search_query['bool']['filter'].append({'term': {'category.keyword': filters['category']}})
        if 'brand' in filters:
            search_query['bool']['filter'].append({'term': {'brand.keyword': filters['brand']}})
        if 'min_price' in filters or 'max_price' in filters:
            price_range = {}
            if 'min_price' in filters:
                price_range['gte'] = filters['min_price']
            if 'max_price' in filters:
                price_range['lte'] = filters['max_price']
            search_query['bool']['filter'].append({'range': {'price': price_range}})
        if 'in_stock' in filters and filters['in_stock']:
            search_query['bool']['filter'].append({'term': {'in_stock': True}})
    
    sort_options = {
        'price_asc': [{'price': 'asc'}],
        'price_desc': [{'price': 'desc'}],
        'rating': [{'rating': 'desc'}],
        'newest': [{'created_at': 'desc'}],
    }
    
    sort = sort_options.get(sort_by, [{'_score': 'desc'}])
    
    from_offset = (page - 1) * page_size
    
    body = {
        'query': search_query,
        'sort': sort,
        'from': from_offset,
        'size': page_size
    }
    
    result = es.search(index=index_name, body=body)
    
    return {
        'total': result['hits']['total']['value'],
        'results': [hit['_source'] for hit in result['hits']['hits']]
    }
