from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Only allow users with is_admin=True."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            hasattr(request.user, 'is_admin') and
            request.user.is_admin
        )
