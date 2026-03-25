from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        # Register custom Django system checks for runtime security settings.
        from . import checks  # noqa: F401
