from django.contrib import admin
from django.urls import path, include
from django.conf import settings # <--- Import
from django.conf.urls.static import static # <--- Import
from rest_framework.routers import DefaultRouter
from issues.views import ProjectViewSet, IssueViewSet, register, CommentViewSet, UserViewSet, custom_login, custom_logout, SubtaskViewSet, AttachmentViewSet # <--- Import AttachmentViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'issues', IssueViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'users', UserViewSet)
router.register(r'subtasks', SubtaskViewSet)
router.register(r'attachments', AttachmentViewSet) # <--- Register new route

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/login/', custom_login),
    path('api/auth/logout/', custom_logout),
    path('api/auth/register/', register),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) # <--- Enable Media serving