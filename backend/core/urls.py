from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from issues.views import ProjectViewSet, IssueViewSet, CommentViewSet, UserViewSet, custom_login, custom_logout # Import them

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'issues', IssueViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'users', UserViewSet)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # NEW: Custom JSON auth endpoints
    path('api/login/', custom_login),
    path('api/logout/', custom_logout),
]