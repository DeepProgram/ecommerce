from rest_framework import serializers
from .models import Order, OrderItem, Cart, CartItem, Payment
from catalog.serializers import ProductListSerializer, VariantSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'variant_info', 'sku', 'quantity', 'unit_price', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_method = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_status', 
            'subtotal', 'shipping_cost', 'tax', 'discount', 'total',
            'shipping_full_name', 'shipping_phone', 'shipping_address_line1',
            'shipping_address_line2', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_country',
            'payment_method', 'items', 'created_at'
        ]
        read_only_fields = ['order_number', 'created_at']
    
    def get_payment_method(self, obj):
        payment = obj.payments.first()
        return payment.payment_method if payment else None


class OrderCreateSerializer(serializers.Serializer):
    shipping_address_id = serializers.IntegerField()
    billing_address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=['credit_card', 'debit_card', 'upi', 'wallet', 'cod'])
    notes = serializers.CharField(required=False, allow_blank=True)


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    variant = VariantSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    variant_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'variant', 'product_id', 'variant_id', 'quantity', 'created_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'created_at', 'updated_at']
    
    def get_total(self, obj):
        from decimal import Decimal
        total = Decimal('0.00')
        for item in obj.items.all():
            if item.variant:
                price = item.variant.effective_price
            else:
                price = item.product.base_price
            total += price * item.quantity
        return total
