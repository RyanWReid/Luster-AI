"""Add job lease columns for preventing stuck jobs

Revision ID: a2f3b4c5d6e7
Revises: e0e701b7218e
Create Date: 2025-01-26 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a2f3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "e0e701b7218e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add lease columns to jobs table for preventing stuck jobs."""
    # Add lease_expires_at - when the worker's lease on this job expires
    op.add_column(
        "jobs",
        sa.Column("lease_expires_at", sa.DateTime(), nullable=True),
    )
    # Add retry_count - how many times this job has been attempted
    op.add_column(
        "jobs",
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
    )
    # Add max_retries - maximum number of retry attempts before permanent failure
    op.add_column(
        "jobs",
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
    )
    # Add index for efficient lease expiry queries
    op.create_index(
        "idx_jobs_lease_expires_at",
        "jobs",
        ["lease_expires_at"],
        unique=False,
    )


def downgrade() -> None:
    """Remove lease columns from jobs table."""
    op.drop_index("idx_jobs_lease_expires_at", table_name="jobs")
    op.drop_column("jobs", "max_retries")
    op.drop_column("jobs", "retry_count")
    op.drop_column("jobs", "lease_expires_at")
