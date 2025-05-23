from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, UserViewSet, UserLoginView, PasswordResetView,
    UserProfileView, CustomTokenRefreshView, CheckUsernameView
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),
]