# Quick Reference Card

## 🚀 Start Everything
```bash
docker-compose up --build
```

## 🎯 First Time Setup
```bash
# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Initialize search
docker-compose exec backend python manage.py init_search
```

## 🌐 Access URLs
- **Main Site**: http://localhost
- **Admin**: http://localhost/admin
- **API Docs**: http://localhost/api/
- **RabbitMQ**: http://localhost:15672 (ecommerce_user / ecommerce_pass)

## 📦 Key API Endpoints

### Catalog
```
GET  /api/catalog/categories/
GET  /api/catalog/products/
GET  /api/catalog/products/{slug}/
GET  /api/catalog/search/?q=keyword
```

### Cart & Orders
```
GET    /api/orders/cart/
POST   /api/orders/cart/items/          # Add to cart
PATCH  /api/orders/cart/items/{id}/     # Update quantity
DELETE /api/orders/cart/items/{id}/     # Remove item
POST   /api/orders/orders/create/       # Create order
GET    /api/orders/orders/               # List orders
GET    /api/orders/orders/{order_number}/
```

## 🔧 Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f worker-order
docker-compose logs -f worker-search

# Django shell
docker-compose exec backend python manage.py shell

# Database
docker-compose exec db-primary psql -U ecommerce_user -d ecommerce

# Restart service
docker-compose restart backend

# Stop all
docker-compose down

# Clean everything (⚠️ removes data)
docker-compose down -v
```

## 📊 Services Status
```bash
docker-compose ps
```

## 🐛 Debug

### Check queue status
http://localhost:15672 → Queues tab

### View worker output
```bash
docker-compose logs -f worker-order
```

### Check replication
```bash
docker-compose exec db-primary psql -U ecommerce_user -d ecommerce \
  -c "SELECT * FROM pg_stat_replication;"
```

## 📝 Order Flow Test

### 1. Create test data (via admin)
- Category
- Brand  
- Product with variants
- Set stock quantity

### 2. Create user & address
```python
docker-compose exec backend python manage.py shell

from users.models import User, Address
user = User.objects.create_user(
    username='test', 
    email='test@test.com', 
    password='test123'
)
Address.objects.create(
    user=user,
    address_type='shipping',
    full_name='Test User',
    phone='1234567890',
    address_line1='123 Test St',
    city='Test City',
    state='TS',
    postal_code='12345',
    country='USA',
    is_default=True
)
```

### 3. Test order creation
```python
from orders.models import Cart, CartItem, Order
from catalog.models import Product, Variant

cart, _ = Cart.objects.get_or_create(user=user)
product = Product.objects.first()
variant = product.variants.first()

CartItem.objects.create(
    cart=cart,
    product=product,
    variant=variant,
    quantity=2
)
```

Then create order via API or admin.

## 🎯 What to Check

✅ All services healthy: `docker-compose ps`
✅ Backend responds: `curl http://localhost/api/catalog/categories/`
✅ Admin accessible: http://localhost/admin
✅ Workers running: `docker-compose ps | grep worker`
✅ Queues present: http://localhost:15672
✅ Elasticsearch healthy: `curl http://localhost:9200/_cluster/health`

## 📦 RabbitMQ Queues

1. **order.process** - Order processing
2. **email.send_order_confirmation** - Email sending
3. **search.index_product** - Search indexing

## 🎨 Architecture

```
Client → NGINX → Backend → Primary DB (writes)
                        ↘ Replica DB (reads)
                        ↘ Redis (cache)
                        ↘ RabbitMQ → Workers
                        ↘ Elasticsearch (search)
```

## 🔐 Default Credentials

- **PostgreSQL**: ecommerce_user / ecommerce_pass
- **RabbitMQ**: ecommerce_user / ecommerce_pass
- **Django Admin**: (create with createsuperuser)

## 📁 Important Files

- `docker-compose.yml` - All services
- `backend/worker.py` - Workers (search, order)
- `backend/orders/views.py` - Order API
- `backend/config/rabbitmq.py` - Queue publisher
- `nginx/nginx.conf` - NGINX config

## 💡 Tips

- Check logs first when debugging
- Workers auto-restart on failure
- Redis cache clears on restart
- Elasticsearch needs reindexing after data changes
- Use FINAL_SETUP.md for detailed instructions

---

**Need help?** Check FINAL_SETUP.md for complete details!
