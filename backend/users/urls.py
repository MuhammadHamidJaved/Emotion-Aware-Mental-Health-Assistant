from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, MeView, RegisterView
from . import settings_views

app_name = "users"

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    
    # Settings endpoints
    path("settings/profile/", settings_views.settings_profile, name="settings-profile"),
    path("settings/notifications/", settings_views.settings_notifications, name="settings-notifications"),
    path("settings/privacy/", settings_views.settings_privacy, name="settings-privacy"),
    path("settings/appearance/", settings_views.settings_appearance, name="settings-appearance"),
    path("settings/export-data/", settings_views.settings_export_data, name="settings-export-data"),
    path("settings/delete-account/", settings_views.settings_delete_account, name="settings-delete-account"),
]


