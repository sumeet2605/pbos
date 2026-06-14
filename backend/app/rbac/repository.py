from app.rbac.models import Permission, Role, UserRole
from app.shared.repository import BaseRepository


class RoleRepository(BaseRepository[Role]):
    model = Role


class PermissionRepository(BaseRepository[Permission]):
    model = Permission


class UserRoleRepository(BaseRepository[UserRole]):
    model = UserRole
