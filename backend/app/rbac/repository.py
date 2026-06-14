from app.rbac.models import Permission, Role, RolePermission, UserRole
from app.shared.repository import BaseRepository


class RoleRepository(BaseRepository[Role]):
    model = Role


class PermissionRepository(BaseRepository[Permission]):
    model = Permission


class RolePermissionRepository(BaseRepository[RolePermission]):
    model = RolePermission


class UserRoleRepository(BaseRepository[UserRole]):
    model = UserRole
