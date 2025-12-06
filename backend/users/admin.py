from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from .settings_models import UserPreferences


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('profile_picture', 'bio', 'phone_number', 'date_of_birth')}),
        ('Preferences', {'fields': ('preferred_journal_time', 'enable_biometric', 'enable_notifications')}),
        ('Stats', {'fields': ('total_entries', 'current_streak', 'longest_streak')}),
    )


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
