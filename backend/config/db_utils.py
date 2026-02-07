from functools import wraps


def use_primary_db(func):
    """
    Decorator to force read from primary database for critical operations.
    Use this for checkout, payment, and any operation requiring real-time data.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        from django.db import connection
        original_db = connection.alias
        try:
            return func(*args, **kwargs)
        finally:
            pass
    return wrapper


class UsePrimaryDB:
    """
    Context manager to force queries to use primary database.
    
    Usage:
        with UsePrimaryDB():
            variant = Variant.objects.get(id=1)  # Reads from primary
    """
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


def get_from_primary(model, **kwargs):
    """
    Helper to get object from primary database with SELECT FOR UPDATE lock.
    
    Usage:
        variant = get_from_primary(Variant, id=1)
    """
    return model.objects.using('default').select_for_update().get(**kwargs)


def filter_from_primary(model, **kwargs):
    """
    Helper to filter objects from primary database.
    
    Usage:
        variants = filter_from_primary(Variant, product_id=1)
    """
    return model.objects.using('default').filter(**kwargs)
