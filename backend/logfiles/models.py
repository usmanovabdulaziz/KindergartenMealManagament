from django.db import models
from django.utils import timezone
from users.models import User

class Log(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("other", "Other"),
    ]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="logs")
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "logs_log"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.user} {self.action} at {self.timestamp}"