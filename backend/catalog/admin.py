from django.contrib import admin
from .models import (
    Category, AttributeDefinition, Brand, Product, 
    ProductImage, ProductAttributeValue, Variant, 
    VariantAttributeValue, Review
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(AttributeDefinition)
class AttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'attribute_type', 'is_variant_attribute', 'is_required']
    list_filter = ['category', 'attribute_type', 'is_variant_attribute']
    search_fields = ['name', 'category__name']


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductAttributeValueInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 1


class VariantInline(admin.TabularInline):
    model = Variant
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'category', 'brand', 'base_price', 'has_variants', 'is_active', 'created_at']
    list_filter = ['category', 'brand', 'has_variants', 'is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductAttributeValueInline, VariantInline]


class VariantAttributeValueInline(admin.TabularInline):
    model = VariantAttributeValue
    extra = 1


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ['sku', 'product', 'price', 'stock_quantity', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['sku', 'product__name']
    inlines = [VariantAttributeValueInline]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'is_verified_purchase', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_verified_purchase', 'is_approved', 'created_at']
    search_fields = ['product__name', 'user__email', 'title', 'comment']
