from rest_framework import viewsets, permissions
from rest_framework.decorators import action  # <--- CRITICAL IMPORT
from rest_framework.response import Response  # <--- CRITICAL IMPORT
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.db import IntegrityError
import json
from django.db.models import Q
from .models import Attachment, Subtask # <--- Import
from .serializers import AttachmentSerializer, SubtaskSerializer # <--- Import
from django.core.mail import send_mail # <--- Add this
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Project, Issue, Comment
from .serializers import (
    ProjectSerializer, 
    IssueSerializer, 
    CommentSerializer, 
    UserLiteSerializer
)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserLiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # 1. Update User fields (First Name, Last Name, Email)
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # 2. Manually Update Avatar (if provided)
                if 'avatar' in request.FILES:
                    profile = user.profile
                    profile.avatar = request.FILES['avatar']
                    profile.save()

                # Return fresh data (including new avatar URL)
                return Response(self.get_serializer(user).data)
            
            return Response(serializer.errors, status=400)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 1. SECURITY: Only show projects I am part of
    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(Q(owner=user) | Q(members=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # 2. ACTION: Invite a user
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        username = request.data.get('username')
        
        try:
            user = User.objects.get(username=username)
            if user == project.owner:
                 return Response({'error': 'User is already the owner'}, status=400)
            
            project.members.add(user)
            return Response({'status': f'{username} added to project'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Save the issue
        issue = serializer.save(reporter=self.request.user)
        
        # Check if there is an assignee to notify
        if issue.assignee and issue.assignee != self.request.user:
            self.send_assignment_email(issue)

    def perform_update(self, serializer):
        # Get the old assignee before saving
        old_assignee = self.get_object().assignee
        
        # Save the changes
        issue = serializer.save()
        
        # If assignee CHANGED and is not the current user, send email
        if issue.assignee and issue.assignee != old_assignee and issue.assignee != self.request.user:
            self.send_assignment_email(issue)

    # --- HELPER FUNCTION ---
    def send_assignment_email(self, issue):
        subject = f"You've been assigned: {issue.key} - {issue.title}"
        message = f"""
        Hello {issue.assignee.username},

        You have been assigned to a new ticket by {issue.reporter.username}.

        Project: {issue.project.name}
        Ticket: {issue.key}
        Title: {issue.title}
        Priority: {issue.priority}
        
        Description:
        {issue.description}

        Good luck!
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [issue.assignee.email],
                fail_silently=False,
            )
            print(f"Email sent to {issue.assignee.email}")
        except Exception as e:
            print(f"Failed to send email: {e}")

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = Comment.objects.all()
        issue_id = self.request.query_params.get('issue')
        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)
        return queryset.order_by('created_at')

# --- CUSTOM AUTH VIEWS ---

class SubtaskViewSet(viewsets.ModelViewSet):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Filter by issue: /api/subtasks/?issue=1
    def get_queryset(self):
        queryset = Subtask.objects.all()
        issue_id = self.request.query_params.get('issue')
        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)
        return queryset

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # Allow file uploads

    def perform_create(self, serializer):
        serializer.save()
    
@csrf_exempt
def custom_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                login(request, user)
                csrf_token = get_token(request) 
                return JsonResponse({
                    'status': 'success', 
                    'username': user.username,
                    'csrf_token': csrf_token
                })
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def custom_logout(request):
    logout(request)
    return JsonResponse({'status': 'logged out'})

@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            email = data.get('email', '')

            if not username or not password:
                return JsonResponse({'error': 'Username and password required'}, status=400)

            # Create the user
            user = User.objects.create_user(username=username, password=password, email=email)
            return JsonResponse({'status': 'success', 'username': user.username})

        except IntegrityError:
            return JsonResponse({'error': 'Username already exists'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)