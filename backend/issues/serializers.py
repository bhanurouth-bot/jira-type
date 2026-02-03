from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Issue, Comment, Subtask, Attachment 

# 1. DEFINE THIS AT THE VERY TOP (So other serializers can use it)
class UserLiteSerializer(serializers.ModelSerializer):
    # Fetch avatar from the related profile
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        # Include 'avatar' here
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'avatar'] 

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserLiteSerializer(read_only=True)
    members = UserLiteSerializer(many=True, read_only=True) # <--- Show full member details

    class Meta:
        model = Project
        fields = ['id', 'name', 'key', 'description', 'owner', 'members', 'created_at']
        read_only_fields = ['owner', 'created_at', 'members']

class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ['id', 'title', 'completed', 'issue']

class CommentSerializer(serializers.ModelSerializer):
    # Now this will correctly use the serializer defined above (with avatar)
    author = UserLiteSerializer(read_only=True) 

    class Meta:
        model = Comment
        fields = ['id', 'issue', 'author', 'text', 'created_at']
        # CRITICAL FIX: Only 'author' is read-only. 'issue' is required for creation.
        read_only_fields = ['author'] 

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'issue', 'file', 'uploaded_at']

class IssueSerializer(serializers.ModelSerializer):
    assignee_details = UserLiteSerializer(source='assignee', read_only=True)
    reporter_details = UserLiteSerializer(source='reporter', read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    
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