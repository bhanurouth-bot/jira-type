from rest_framework import viewsets, permissions
from rest_framework.decorators import action  # <--- CRITICAL IMPORT
from rest_framework.response import Response  # <--- CRITICAL IMPORT
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.http import JsonResponse
import json

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

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    # --- THIS IS THE NEW ACTION ---
    @action(detail=False, methods=['post'])
    def bulk_update_order(self, request):
        # Expects: { "issues": [ { "id": 1, "order": 0 }, ... ] }
        updates = request.data.get('issues', [])
        for item in updates:
            Issue.objects.filter(id=item['id']).update(order=item['order'])
        return Response({'status': 'orders updated'})

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