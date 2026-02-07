import pika
import json
import time
import logging
import sys
import os
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from config.elasticsearch import index_product, delete_product_from_index
from catalog.models import Product

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Worker:
    def __init__(self, queue_name, max_retries=3):
        self.queue_name = queue_name
        self.max_retries = max_retries
        self.connection = None
        self.channel = None
    
    def connect(self):
        parameters = pika.URLParameters(settings.RABBITMQ_URL)
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        
        self.channel.queue_declare(queue=self.queue_name, durable=True)
        self.channel.queue_declare(queue=f"{self.queue_name}_dlq", durable=True)
        
        self.channel.basic_qos(prefetch_count=1)
    
    def process_message(self, message):
        raise NotImplementedError("Subclasses must implement process_message")
    
    def handle_message(self, ch, method, properties, body):
        try:
            message = json.loads(body)
            job_id = message.get('job_id')
            task_name = message.get('task_name')
            
            logger.info(f"Processing job {job_id}: {task_name}")
            
            self.process_message(message)
            
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            
            retry_count = properties.headers.get('x-retry-count', 0) if properties.headers else 0
            
            if retry_count < self.max_retries:
                retry_count += 1
                headers = {'x-retry-count': retry_count}
                
                delay = 5 * (2 ** retry_count)
                time.sleep(delay)
                
                ch.basic_publish(
                    exchange='',
                    routing_key=self.queue_name,
                    body=body,
                    properties=pika.BasicProperties(
                        delivery_mode=2,
                        headers=headers
                    )
                )
                ch.basic_ack(delivery_tag=method.delivery_tag)
                logger.info(f"Requeued message, retry {retry_count}/{self.max_retries}")
            else:
                ch.basic_publish(
                    exchange='',
                    routing_key=f"{self.queue_name}_dlq",
                    body=body,
                    properties=pika.BasicProperties(delivery_mode=2)
                )
                ch.basic_ack(delivery_tag=method.delivery_tag)
                logger.error(f"Message moved to DLQ after {self.max_retries} retries")
    
    def start(self):
        logger.info(f"Worker started, listening on queue: {self.queue_name}")
        
        while True:
            try:
                if not self.connection or self.connection.is_closed:
                    self.connect()
                
                self.channel.basic_consume(
                    queue=self.queue_name,
                    on_message_callback=self.handle_message
                )
                
                self.channel.start_consuming()
                
            except KeyboardInterrupt:
                logger.info("Worker stopped by user")
                break
            except Exception as e:
                logger.error(f"Connection error: {e}", exc_info=True)
                time.sleep(5)
        
        if self.connection and not self.connection.is_closed:
            self.connection.close()


class SearchIndexWorker(Worker):
    def __init__(self):
        super().__init__(queue_name='search.index_product')
    
    def process_message(self, message):
        payload = message.get('payload', {})
        product_id = payload.get('product_id')
        event_type = payload.get('event_type', 'update')
        
        if event_type == 'delete':
            delete_product_from_index(product_id)
            logger.info(f"Deleted product {product_id} from search index")
        else:
            product = Product.objects.get(id=product_id)
            index_product(product)
            logger.info(f"Indexed product {product_id} in search index")


class EmailWorker(Worker):
    def __init__(self):
        super().__init__(queue_name='email.send_order_confirmation')
    
    def process_message(self, message):
        payload = message.get('payload', {})
        order_id = payload.get('order_id')
        
        logger.info(f"Sending order confirmation email for order {order_id}")


class OrderProcessingWorker(Worker):
    def __init__(self):
        super().__init__(queue_name='order.process')
    
    def process_message(self, message):
        from orders.models import Order
        from decimal import Decimal
        
        payload = message.get('payload', {})
        order_id = payload.get('order_id')
        action = payload.get('action', 'confirm')
        
        logger.info(f"Processing order {order_id}, action: {action}")
        
        try:
            order = Order.objects.get(id=order_id)
            
            if action == 'confirm':
                order.status = 'confirmed'
                order.save()
                logger.info(f"Order {order.order_number} confirmed")
                
                from config.rabbitmq import RabbitMQPublisher
                with RabbitMQPublisher() as publisher:
                    publisher.publish_event(
                        queue_name='email.send_order_confirmation',
                        task_name='send_order_email',
                        payload={
                            'order_id': order_id,
                            'order_number': order.order_number,
                            'user_email': order.user.email
                        }
                    )
                
            elif action == 'ship':
                order.status = 'shipped'
                order.save()
                logger.info(f"Order {order.order_number} marked as shipped")
                
            elif action == 'deliver':
                order.status = 'delivered'
                order.save()
                logger.info(f"Order {order.order_number} marked as delivered")
                
            elif action == 'cancel':
                if order.status not in ['shipped', 'delivered']:
                    order.status = 'cancelled'
                    order.save()
                    
                    for item in order.items.all():
                        if item.variant:
                            item.variant.stock_quantity += item.quantity
                            item.variant.save()
                    
                    logger.info(f"Order {order.order_number} cancelled and stock restored")
                else:
                    logger.warning(f"Cannot cancel order {order.order_number} - already {order.status}")
            
            elif action == 'update_inventory':
                for item in order.items.all():
                    if item.variant:
                        item.variant.stock_quantity -= item.quantity
                        item.variant.save()
                        logger.info(f"Updated stock for {item.variant.sku}: -{item.quantity}")
                        
                        from config.rabbitmq import publish_product_event
                        publish_product_event(item.product.id, event_type='update')
                
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found")
            raise
        except Exception as e:
            logger.error(f"Error processing order {order_id}: {e}", exc_info=True)
            raise


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python worker.py [search|email|order]")
        sys.exit(1)
    
    worker_type = sys.argv[1]
    
    if worker_type == 'search':
        worker = SearchIndexWorker()
    elif worker_type == 'email':
        worker = EmailWorker()
    elif worker_type == 'order':
        worker = OrderProcessingWorker()
    else:
        print(f"Unknown worker type: {worker_type}")
        sys.exit(1)
    
    worker.start()
