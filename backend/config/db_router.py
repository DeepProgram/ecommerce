class PrimaryReplicaRouter:
    def db_for_read(self, model, **hints):
        if hasattr(model, '_use_primary_db') and model._use_primary_db:
            return 'default'
        return 'replica' if 'replica' in self.get_available_dbs() else 'default'

    def db_for_write(self, model, **hints):
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return db == 'default'
    
    def get_available_dbs(self):
        from django.conf import settings
        return settings.DATABASES.keys()
