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


class ProductSearchView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return Product.objects.none()
        
        return Product.objects.filter(
            is_active=True,
            name__icontains=query
        ).select_related('brand', 'category').prefetch_related('images')[:50]
