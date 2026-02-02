from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Issue, Comment, Subtask, Attachment # <--- Make sure Subtask is imported

class UserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['owner', 'created_at']

# --- NEW SERIALIZER ---
class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ['id', 'title', 'completed', 'issue']

class CommentSerializer(serializers.ModelSerializer):
    author = UserLiteSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'issue', 'file', 'uploaded_at']

class IssueSerializer(serializers.ModelSerializer):
    assignee_details = UserLiteSerializer(source='assignee', read_only=True)
    reporter_details = UserLiteSerializer(source='reporter', read_only=True)
    
    # --- NEW FIELD FOR PROGRESS ---
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = '__all__'
        read_only_fields = ['reporter', 'created_at']

    def get_progress(self, obj):
        total = obj.subtasks.count()
        if total == 0:
            return None
        completed = obj.subtasks.filter(completed=True).count()
        return {'total': total, 'completed': completed}
    
class UserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Add first_name, last_name, and email
        fields = ['id', 'username', 'first_name', 'last_name', 'email']