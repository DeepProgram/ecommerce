from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/', views.CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', views.CartItemUpdateView.as_view(), name='cart-item-update'),
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('orders/create/', views.OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
]
