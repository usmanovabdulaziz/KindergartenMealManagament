from rest_framework import serializers
from .models import Log
from users.serializers import UserSerializer

class LogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Log
        fields = ["id", "user", "action", "details", "timestamp"]