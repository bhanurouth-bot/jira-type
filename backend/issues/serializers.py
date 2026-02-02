from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Issue, Comment

# 1. Simple User Serializer (for Assignee/Reporter fields)
class UserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

# 2. Project Serializer
class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Project
        fields = ['id', 'name', 'key', 'description', 'owner', 'owner_name', 'created_at']
        read_only_fields = ['owner']  # Owner is set automatically based on logged-in user

# 3. Comment Serializer
class CommentSerializer(serializers.ModelSerializer):
    author = UserLiteSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'issue', 'author', 'text', 'created_at']
        read_only_fields = ['author']

# 4. Issue Serializer (The Big One)
class IssueSerializer(serializers.ModelSerializer):
    # Retrieve the computed "PROJ-1" key
    key = serializers.ReadOnlyField() 
    
    # Nested serializers for reading (so we see names, not just IDs)
    assignee_details = UserLiteSerializer(source='assignee', read_only=True)
    reporter_details = UserLiteSerializer(source='reporter', read_only=True)
    project_key = serializers.ReadOnlyField(source='project.key')

    class Meta:
        model = Issue
        fields = [
            'id', 'key', 'title', 'description', 
            'project', 'project_key',
            'status', 'priority', 'issue_type',
            'assignee', 'assignee_details',
            'reporter', 'reporter_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['reporter', 'key_id']

    # Validation example: Prevent changing status to DONE if description is empty?
    # You can add that logic here later.