import pika
import json
import uuid
from datetime import datetime
from django.conf import settings


class RabbitMQPublisher:
    def __init__(self):
        self.connection = None
        self.channel = None
    
    def connect(self):
        parameters = pika.URLParameters(settings.RABBITMQ_URL)
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
    
    def close(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()
    
    def publish_event(self, queue_name, task_name, payload, trace_id=None):
        if not self.channel or self.connection.is_closed:
            self.connect()
        
        self.channel.queue_declare(queue=queue_name, durable=True)
        
        message = {
            'task_name': task_name,
            'job_id': str(uuid.uuid4()),
            'payload': payload,
            'created_at': datetime.utcnow().isoformat(),
            'trace_id': trace_id or str(uuid.uuid4())
        }
        
        self.channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def publish_product_event(product_id, event_type='update'):
    try:
        with RabbitMQPublisher() as publisher:
            publisher.publish_event(
                queue_name='search.index_product',
                task_name='index_product',
                payload={
                    'product_id': product_id,
                    'event_type': event_type
                }
            )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to publish product event: {e}")


def publish_order_event(order_id, event_type):
    try:
        with RabbitMQPublisher() as publisher:
            publisher.publish_event(
                queue_name='email.send_order_confirmation',
                task_name='send_order_email',
                payload={
                    'order_id': order_id,
                    'event_type': event_type
                }
            )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to publish order event: {e}")
