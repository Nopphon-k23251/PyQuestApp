"""add_submission_stderr

Revision ID: 185652de0544
Revises: 2a4ac3179c04
Create Date: 2026-09-24 01:03:22.973733

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '185652de0544'
down_revision: Union[str, Sequence[str], None] = '2a4ac3179c04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('submissions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stderr', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('submissions', schema=None) as batch_op:
        batch_op.drop_column('stderr')
