from rest_framework.permissions import BasePermission, SAFE_METHODS

def get_role_name(user):
    """
    Robustly get the user's role as a lowercase string.
    Assumes user.role could be None, a string, or a related model with a 'name' attribute.
    """
    if not user or not user.is_authenticated:
        return None
    role = getattr(user, 'role', None)
    if not role:
        return None
    if isinstance(role, str):
        return role.lower()
    # If role is a related model with a 'name' attribute
    name = getattr(role, 'name', None)
    if name:
        return name.lower()
    return str(role).lower()

def role_is(user, role):
    return user.is_authenticated and get_role_name(user) == role.lower()

class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return role_is(request.user, 'admin')

class IsManagerOnly(BasePermission):
    def has_permission(self, request, view):
        return role_is(request.user, 'manager')

class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            get_role_name(request.user) in ['admin', 'manager']
        )

class IsCookOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            get_role_name(request.user) in ['cook', 'admin']
        )

class IsAdminOrManagerOrCook(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Allow all actions for admin, manager, cook
        return request.user.role.name in ("admin", "manager", "cook")

class IsCook(BasePermission):
    def has_permission(self, request, view):
        return role_is(request.user, 'cook')