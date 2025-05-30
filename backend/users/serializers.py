from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Role, User

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=100)
    password = serializers.CharField(max_length=255, write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Username va parol kiritilishi shart.")

        return data

class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'image', 'role']

    def validate_email(self, value):
        if User.objects.exclude(pk=self.instance.pk if self.instance else None).filter(email=value).exists():
            raise serializers.ValidationError("Bu email allaqachon ishlatilgan.")
        return value

    def validate_username(self, value):
        if User.objects.exclude(pk=self.instance.pk if self.instance else None).filter(username=value).exists():
            raise serializers.ValidationError("Bu username allaqachon ishlatilgan.")
        return value


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name', read_only=True)
    display_role_id = serializers.IntegerField(source='role.id', read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'image', 'role', 'display_role_id', 'role_id', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'username': {'required': False},
            'email': {'required': False},
        }

    def get_role(self, obj):
        return obj.role.name.lower() if obj.role else None

    def create(self, validated_data):
        role_id = validated_data.pop('role_id')
        role = Role.objects.get(id=role_id.id)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role
        )
        return user

    def update(self, instance, validated_data):
        role_id = validated_data.pop('role_id', None)
        if role_id:
            instance.role = Role.objects.get(id=role_id.id)
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        instance.save()
        return instance

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        return value

    def validate_role_id(self, value):
        if not Role.objects.filter(id=value.id).exists():
            raise serializers.ValidationError({"role_id": "Noto‘g‘ri rol IDsi. Iltimos, to‘g‘ri rolni tanlang."})
        return value

    def validate_email(self, value):
        if value and User.objects.exclude(pk=self.instance.pk if self.instance else None).filter(email=value).exists():
            raise serializers.ValidationError({"email": ["Bu email allaqachon ishlatilgan."]})
        return value

    def validate_username(self, value):
        if value and User.objects.exclude(pk=self.instance.pk if self.instance else None).filter(username=value).exists():
            raise serializers.ValidationError({"username": ["Bu username allaqachon ishlatilgan."]})
        return value