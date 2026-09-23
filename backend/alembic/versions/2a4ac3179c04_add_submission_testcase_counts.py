"""add_submission_testcase_counts

Revision ID: 2a4ac3179c04
Revises: 17be27af009e
Create Date: 2026-09-24 00:48:04.481122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a4ac3179c04'
down_revision: Union[str, Sequence[str], None] = '17be27af009e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('submissions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('passed_test_cases', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('total_test_cases', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('submissions', schema=None) as batch_op:
        batch_op.drop_column('total_test_cases')
        batch_op.drop_column('passed_test_cases')
