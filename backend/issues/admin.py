from django.contrib import admin
from .models import Project, Issue, Comment

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'key', 'owner', 'created_at')
    search_fields = ('name', 'key')
    # Use raw_id_fields if you have thousands of users, 
    # but for a team tool, a dropdown is fine.

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    # 'key' is the property we defined in the model (e.g., PROJ-101)
    list_display = ('key', 'title', 'status', 'priority', 'assignee', 'updated_at')
    
    # Filter sidebar on the right
    list_filter = ('project', 'status', 'priority', 'issue_type')
    
    # Search by title or the computed key
    search_fields = ('title', 'description')
    
    # Don't let admins manually mess with the auto-increment ID
    readonly_fields = ('key_id', 'created_at', 'updated_at')

    # Organize the layout slightly for better readability
    fieldsets = (
        ('Project Info', {
            'fields': ('project', 'key_id')
        }),
        ('Issue Details', {
            'fields': ('title', 'description', 'issue_type', 'priority', 'status')
        }),
        ('People', {
            'fields': ('assignee', 'reporter')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('issue', 'author', 'short_text', 'created_at')

    def short_text(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text