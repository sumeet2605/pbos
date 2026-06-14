import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("clients", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("projects", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("projects", "deleted_at")
    op.drop_column("clients", "deleted_at")
