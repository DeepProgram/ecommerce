from rest_framework import serializers
from .models import (
    Category, Product, ProductImage, ProductAttributeValue,
    Variant, VariantAttributeValue, Review, Brand
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'description', 'is_active']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'display_order']


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source='attribute.name', read_only=True)
    attribute_slug = serializers.CharField(source='attribute.slug', read_only=True)

    class Meta:
        model = ProductAttributeValue
        fields = ['attribute_name', 'attribute_slug', 'value']


class VariantAttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source='attribute.name', read_only=True)
    attribute_slug = serializers.CharField(source='attribute.slug', read_only=True)

    class Meta:
        model = VariantAttributeValue
        fields = ['attribute_name', 'attribute_slug', 'value']


class VariantSerializer(serializers.ModelSerializer):
    attribute_values = VariantAttributeValueSerializer(many=True, read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Variant
        fields = ['id', 'sku', 'price', 'effective_price', 'stock_quantity', 'is_active', 'attribute_values']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'description', 'logo']


class ProductListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'base_price', 'brand', 'category', 'primary_image', 'has_variants']

    def get_primary_image(self, obj):
        image = obj.images.first()
        if image:
            return ProductImageSerializer(image).data
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    attribute_values = ProductAttributeValueSerializer(many=True, read_only=True)
    variants = VariantSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'base_price', 'brand', 
            'category', 'images', 'attribute_values', 'has_variants', 
            'variants', 'average_rating', 'review_count', 'is_active'
        ]

    def get_average_rating(self, obj):
        from django.db.models import Avg
        result = obj.reviews.filter(is_approved=True).aggregate(Avg('rating'))
        return round(result['rating__avg'], 2) if result['rating__avg'] else None

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'title', 'comment', 'is_verified_purchase', 'created_at']
        read_only_fields = ['is_verified_purchase', 'created_at']
