from django.contrib import admin
from .models import JournalEntry, EntryTag, EntryTagRelation, EntryMedia


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'get_title_display', 'emotion', 'entry_type', 'entry_date', 'is_draft', 'is_favorite')
    list_filter = ('entry_type', 'emotion', 'is_draft', 'is_favorite', 'entry_date')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'get_title_display', 'get_content_display')
    
    def get_title_display(self, obj):
        """Display decrypted title"""
        return obj.get_title() or '(No title)'
    get_title_display.short_description = 'Title'
    
    def get_content_display(self, obj):
        """Display decrypted content preview"""
        content = obj.get_text_content()
        return content[:100] + '...' if len(content) > 100 else content
    get_content_display.short_description = 'Content'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'entry_type', 'get_title_display', 'get_content_display')
        }),
        ('Emotion', {
            'fields': ('emotion', 'emotion_confidence')
        }),
        ('Files', {
            'fields': ('voice_file', 'video_file'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('word_count', 'duration', 'privacy_setting', 'entry_date', 'is_favorite', 'is_draft')
        }),
        ('Location', {
            'fields': ('location_name', 'latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EntryTag)
class EntryTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'color', 'usage_count', 'created_at')
    list_filter = ('color', 'created_at')
    search_fields = ('name', 'user__username')


admin.site.register(EntryTagRelation)
admin.site.register(EntryMedia)
