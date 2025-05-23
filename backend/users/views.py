from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from .models import Role, User
from .serializers import RoleSerializer, UserLoginSerializer, UserProfileSerializer, UserSerializer
from .permissions import IsAdminOnly, IsAdminOrManager
from django.utils import timezone


class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")

        if not username:
            return Response(
                {"error": "Username kiritilishi shart."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
            return Response(
                {"message": "Username topildi."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Ushbu username ro‘yxatdan o‘tmagan. Iltimos, to‘g‘ri username kiriting."},
                status=status.HTTP_404_NOT_FOUND
            )

class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            user = authenticate(username=username, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "role": user.role.name if user.role else "user",
                        "email": user.email or "",
                        "username": user.username,
                    },
                    status=status.HTTP_200_OK
                )
            return Response(
                {"error": "Noto'g'ri username yoki parol"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not username:
            return Response(
                {"error": "Username kiritilishi shart."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": "Ushbu username ro‘yxatdan o‘tmagan. Iltimos, to‘g‘ri username kiriting."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not new_password or not confirm_password:
            return Response(
                {"error": "Yangi parol va tasdiqlash paroli kiritilishi shart."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Yangi parol va tasdiqlash paroli mos kelmadi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {"error": e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Parol muvaffaqiyatli o'zgartirildi."},
            status=status.HTTP_200_OK
        )

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.role or request.user.role.name != 'Admin':
            return Response(
                {"error": "Faqat Admin foydalanuvchilar yangi user qo‘shishi mumkin."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Serializer orqali validatsiya qilish
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Foydalanuvchi yaratish
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.role or request.user.role.name != 'Admin':
            return Response(
                {"error": "Faqat Admin foydalanuvchilar foydalanuvchi ma'lumotlarini o‘zgartirishi mumkin."},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        print("Received data:", request.data)  # Yuborilgan ma'lumotlarni log qilish
        if serializer.errors:
            print("Validation errors:", serializer.errors)  # Validatsiya xatolarni log qilish
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)