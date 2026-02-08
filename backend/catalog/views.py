from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from .models import Category, Product
from .serializers import (
    CategorySerializer, ProductListSerializer, 
    ProductDetailSerializer
)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        cache_key = 'categories_list'
        cached_data = cache.get(cache_key)
        
        if cached_data is None:
            queryset = super().get_queryset()
            cache.set(cache_key, list(queryset), 300)
            return queryset
        
        return cached_data


class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'has_variants']
    ordering_fields = ['base_price', 'created_at', 'name']
    ordering = ['-created_at']
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('brand', 'category').prefetch_related('images')


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related(
            'brand', 'category'
        ).prefetch_related(
            'images', 
            'attribute_values__attribute',
            'variants__attribute_values__attribute'
        )


class ProductSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from config.elasticsearch import search_products
        
        query = request.query_params.get('q', '')
        if not query:
            return Response({'results': [], 'total': 0})
        
        # Get filters from query params
        filters = {}
        if request.query_params.get('category'):
            filters['category'] = request.query_params.get('category')
        if request.query_params.get('brand'):
            filters['brand'] = request.query_params.get('brand')
        if request.query_params.get('min_price'):
            filters['min_price'] = float(request.query_params.get('min_price'))
        if request.query_params.get('max_price'):
            filters['max_price'] = float(request.query_params.get('max_price'))
        if request.query_params.get('in_stock'):
            filters['in_stock'] = request.query_params.get('in_stock').lower() == 'true'
        
        # Get sorting and pagination params
        sort_by = request.query_params.get('sort', '_score')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        try:
            # Search using Elasticsearch
            es_results = search_products(
                query=query,
                filters=filters if filters else None,
                page=page,
                page_size=page_size,
                sort_by=sort_by
            )
            
            # Get unique product IDs from ES results (deduplicate variants)
            seen_product_ids = set()
            unique_product_ids = []
            for result in es_results['results']:
                product_id = result['product_id']
                if product_id not in seen_product_ids:
                    seen_product_ids.add(product_id)
                    unique_product_ids.append(product_id)
            
            # Fetch actual Product objects
            products = Product.objects.filter(
                id__in=unique_product_ids,
                is_active=True
            ).select_related('brand', 'category').prefetch_related('images')
            
            # Create a dict for quick lookup
            products_dict = {p.id: p for p in products}
            
            # Order products based on ES result order
            ordered_products = []
            for product_id in unique_product_ids:
                product = products_dict.get(product_id)
                if product:
                    ordered_products.append(product)
            
            # Serialize the products
            serializer = ProductListSerializer(ordered_products, many=True)
            
            return Response({
                'results': serializer.data,
                'total': len(ordered_products),  # Total unique products
                'page': page,
                'page_size': page_size
            })
            
        except Exception as e:
            # Fallback to database search if Elasticsearch fails
            print(f"Elasticsearch error: {e}")
            products = Product.objects.filter(
                is_active=True,
                name__icontains=query
            ).select_related('brand', 'category').prefetch_related('images')[:50]
            
            serializer = ProductListSerializer(products, many=True)
            return Response({
                'results': serializer.data,
                'total': products.count(),
                'page': 1,
                'page_size': 50,
                'fallback': True
            })
