from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction
from decimal import Decimal

from .models import Order, OrderItem, Cart, CartItem, Payment
from .serializers import (
    OrderSerializer, OrderCreateSerializer,
    CartSerializer, CartItemSerializer
)
from users.models import Address
from config.rabbitmq import RabbitMQPublisher


class CartView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartItemSerializer(data=request.data)
        
        if serializer.is_valid():
            product_id = serializer.validated_data['product_id']
            variant_id = serializer.validated_data.get('variant_id')
            quantity = serializer.validated_data['quantity']
            
            from catalog.models import Product, Variant
            
            try:
                product = Product.objects.get(id=product_id)
                variant = Variant.objects.get(id=variant_id) if variant_id else None
                
                if variant and variant.stock_quantity < quantity:
                    return Response(
                        {'error': 'Insufficient stock'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                cart_item, created = CartItem.objects.get_or_create(
                    cart=cart,
                    product=product,
                    variant=variant,
                    defaults={'quantity': quantity}
                )
                
                if not created:
                    cart_item.quantity += quantity
                    cart_item.save()
                
                return Response(
                    CartItemSerializer(cart_item).data,
                    status=status.HTTP_201_CREATED
                )
                
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Variant.DoesNotExist:
                return Response(
                    {'error': 'Variant not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CartItemUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            cart_item = CartItem.objects.get(pk=pk, cart__user=request.user)
            quantity = request.data.get('quantity')
            
            if quantity:
                if cart_item.variant:
                    from catalog.models import Variant
                    variant = Variant.objects.using('default').get(id=cart_item.variant.id)
                    
                    if variant.stock_quantity < quantity:
                        return Response(
                            {'error': 'Insufficient stock'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                cart_item.quantity = quantity
                cart_item.save()
            
            return Response(CartItemSerializer(cart_item).data)
            
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, pk):
        try:
            cart_item = CartItem.objects.get(pk=pk, cart__user=request.user)
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart = Cart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response(
                    {'error': 'Cart is empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            shipping_address = Address.objects.get(
                id=serializer.validated_data['shipping_address_id'],
                user=request.user
            )
            billing_address = Address.objects.get(
                id=serializer.validated_data['billing_address_id'],
                user=request.user
            )
            
            from catalog.models import Variant, Product
            
            subtotal = Decimal('0.00')
            order_items_data = []
            
            for cart_item in cart.items.all():
                if cart_item.variant:
                    variant = Variant.objects.using('default').select_for_update().get(id=cart_item.variant.id)
                    
                    if variant.stock_quantity < cart_item.quantity:
                        return Response(
                            {'error': f'Insufficient stock for {cart_item.product.name}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    price = variant.effective_price
                    sku = variant.sku
                    variant_info = {
                        attr.attribute.name: attr.value
                        for attr in variant.attribute_values.all()
                    }
                else:
                    product = Product.objects.using('default').get(id=cart_item.product.id)
                    price = product.base_price
                    sku = f"PROD-{cart_item.product.id}"
                    variant_info = {}
                
                item_total = price * cart_item.quantity
                subtotal += item_total
                
                order_items_data.append({
                    'product': cart_item.product,
                    'variant': cart_item.variant,
                    'product_name': cart_item.product.name,
                    'variant_info': variant_info,
                    'sku': sku,
                    'quantity': cart_item.quantity,
                    'unit_price': price,
                    'total_price': item_total
                })
            
            shipping_cost = Decimal('5.00')
            tax = subtotal * Decimal('0.18')
            total = subtotal + shipping_cost + tax
            
            order = Order.objects.create(
                user=request.user,
                status='pending',
                payment_status='pending',
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                tax=tax,
                discount=Decimal('0.00'),
                total=total,
                shipping_full_name=shipping_address.full_name,
                shipping_phone=shipping_address.phone,
                shipping_address_line1=shipping_address.address_line1,
                shipping_address_line2=shipping_address.address_line2,
                shipping_city=shipping_address.city,
                shipping_state=shipping_address.state,
                shipping_postal_code=shipping_address.postal_code,
                shipping_country=shipping_address.country,
                billing_full_name=billing_address.full_name,
                billing_phone=billing_address.phone,
                billing_address_line1=billing_address.address_line1,
                billing_address_line2=billing_address.address_line2,
                billing_city=billing_address.city,
                billing_state=billing_address.state,
                billing_postal_code=billing_address.postal_code,
                billing_country=billing_address.country,
                notes=serializer.validated_data.get('notes', '')
            )
            
            for item_data in order_items_data:
                OrderItem.objects.create(order=order, **item_data)
            
            # Create Payment record
            Payment.objects.create(
                order=order,
                payment_method=serializer.validated_data['payment_method'],
                amount=total,
                status='pending'
            )
            
            cart.items.all().delete()
            
            with RabbitMQPublisher() as publisher:
                publisher.publish_event(
                    queue_name='order.process',
                    task_name='process_order',
                    payload={
                        'order_id': order.id,
                        'action': 'update_inventory'
                    }
                )
                
                publisher.publish_event(
                    queue_name='order.process',
                    task_name='process_order',
                    payload={
                        'order_id': order.id,
                        'action': 'confirm'
                    }
                )
            
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )
            
        except Cart.DoesNotExist:
            return Response(
                {'error': 'Cart not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Address.DoesNotExist:
            return Response(
                {'error': 'Address not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')
