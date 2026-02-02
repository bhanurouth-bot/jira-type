from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist # <--- 1. IMPORTANT IMPORT

class Project(models.Model):
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=10, unique=True, help_text="Short code like 'PROJ'")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name='owned_projects')

    def __str__(self):
        return f"{self.name} ({self.key})"

class Issue(models.Model):
    # Enums for Dropdowns (Keep it simple like Jira)
    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MED', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRI', 'Critical'

    class Status(models.TextChoices):
        TODO = 'TODO', 'To Do'
        IN_PROGRESS = 'IN_PROG', 'In Progress'
        REVIEW = 'REVIEW', 'In Review'
        DONE = 'DONE', 'Done'

    class IssueType(models.TextChoices):
        BUG = 'BUG', 'Bug'
        TASK = 'TASK', 'Task'
        STORY = 'STORY', 'Story'

    # Core Fields
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='issues')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # The "Jira-style" Key (e.g., PROJ-101)
    # We store the number part separately to make sorting/generating easier
    key_id = models.IntegerField(editable=False, null=True) 
    
    # Metadata
    issue_type = models.CharField(max_length=10, choices=IssueType.choices, default=IssueType.TASK)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.TODO)
    
    # People
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_issues')
    reporter = models.ForeignKey(User, on_delete=models.PROTECT, related_name='reported_issues')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    order = models.IntegerField(default=0)

    class Meta:
        # Ensures PROJ-1 is unique within the project
        unique_together = ('project', 'key_id')
        ordering = ['order']

    def save(self, *args, **kwargs):
        # Auto-generate the Issue Key ID (e.g., If PROJ has 5 issues, this becomes 6)
        if self.key_id is None:
            max_id = Issue.objects.filter(project=self.project).aggregate(models.Max('key_id'))['key_id__max']
            self.key_id = (max_id or 0) + 1
        super().save(*args, **kwargs)

    @property
    def key(self):
        # Returns the full string, e.g., "PROJ-101"
        return f"{self.project.key}-{self.key_id}"

    def __str__(self):
        return f"{self.key}: {self.title}"

class Comment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author} on {self.issue.key}"
    

class Subtask(models.Model):
    issue = models.ForeignKey(Issue, related_name='subtasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)

    def __str__(self):
        return self.title
    
class Attachment(models.Model):
    issue = models.ForeignKey(Issue, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File for {self.issue.key}"
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # 2. UPDATED SAFE LOGIC
    try:
        instance.profile.save()
    except ObjectDoesNotExist:
        # If the user exists but has no profile (e.g. created before this feature), create one now.
        Profile.objects.create(user=instance)