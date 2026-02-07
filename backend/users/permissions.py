from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners to edit an object.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsOrderOwner(permissions.BasePermission):
    """
    Custom permission for order access.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff


class CanManageInventory(permissions.BasePermission):
    """
    Permission for inventory management.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff
