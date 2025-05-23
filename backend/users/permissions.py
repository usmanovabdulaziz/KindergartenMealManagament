from rest_framework.permissions import BasePermission
from users.models import User

class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Admin'

class IsManagerOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Manager'

class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name in ['Admin', 'Manager']

class IsCookOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name in ['Cook', 'Admin']

class IsCook(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'Cook'