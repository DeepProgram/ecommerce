from django.core.management.base import BaseCommand
from config.elasticsearch import create_product_index, index_product
from catalog.models import Product


class Command(BaseCommand):
    help = 'Initialize Elasticsearch index and index all products'

    def handle(self, *args, **options):
        self.stdout.write('Creating product index...')
        create_product_index()
        self.stdout.write(self.style.SUCCESS('Product index created'))

        self.stdout.write('Indexing products...')
        products = Product.objects.filter(is_active=True).prefetch_related(
            'variants__attribute_values__attribute',
            'attribute_values__attribute',
            'brand',
            'category',
            'reviews'
        )

        count = 0
        for product in products:
            try:
                index_product(product)
                count += 1
                if count % 100 == 0:
                    self.stdout.write(f'Indexed {count} products...')
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error indexing product {product.id}: {e}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully indexed {count} products')
        )
