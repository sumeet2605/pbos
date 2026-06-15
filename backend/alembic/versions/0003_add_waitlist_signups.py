import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

UUID = postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    op.create_table(
        "waitlist_signups",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=False),
        sa.Column("studio_name", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=255), nullable=True),
        sa.Column("photography_type", sa.String(length=255), nullable=True),
        sa.Column("monthly_bookings", sa.String(length=100), nullable=True),
        sa.Column("current_tools", sa.String(length=500), nullable=True),
        sa.Column("biggest_problem", sa.String(length=1000), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'new'")),
        sa.Column("id", UUID, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_waitlist_signups_email"),
    )
    op.create_index("ix_waitlist_signups_email", "waitlist_signups", ["email"], unique=True)
    op.create_index("ix_waitlist_signups_status", "waitlist_signups", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_waitlist_signups_status", table_name="waitlist_signups")
    op.drop_index("ix_waitlist_signups_email", table_name="waitlist_signups")
    op.drop_table("waitlist_signups")
