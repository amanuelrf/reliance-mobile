"""replace credit_scores with credit_check_history

Revision ID: 843b145b1143
Revises: 452506544d12
Create Date: 2026-01-20 01:59:53.622130

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '843b145b1143'
down_revision: Union[str, None] = '452506544d12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop foreign key constraint from credit_scores to credit_checks (if exists)
    op.execute("""
        ALTER TABLE credit_scores
        DROP CONSTRAINT IF EXISTS credit_scores_credit_check_id_fkey
    """)
    
    # 2. Drop the credit_scores table
    op.execute("DROP TABLE IF EXISTS credit_scores")
    
    # 3. Drop the credit_score_result enum type (if exists, no longer needed)
    op.execute("DROP TYPE IF EXISTS credit_score_result")
    
    # 4. Create credit_check_history table with correct column order
    op.execute("""
        CREATE TABLE credit_check_history (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            mc_number INTEGER NOT NULL,
            status status NOT NULL,
            approved_amount INTEGER NOT NULL,
            credit_check_uuid VARCHAR(255) NOT NULL,
            source credit_check_source NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    # Create foreign key to users
    op.execute("""
        ALTER TABLE credit_check_history
        ADD CONSTRAINT credit_check_history_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
    """)
    
    # Create index on id
    op.execute("CREATE INDEX ix_credit_check_history_id ON credit_check_history(id)")


def downgrade() -> None:
    # Drop credit_check_history table
    op.execute("DROP TABLE IF EXISTS credit_check_history")
    
    # Recreate credit_score_result enum type
    op.execute("CREATE TYPE credit_score_result AS ENUM ('REVIEW_REQUIRED', 'APPROVED', 'DENIED', 'INSUFFICIENT_DATA')")
    
    # Recreate credit_scores table
    op.execute("""
        CREATE TABLE credit_scores (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            credit_check_id INTEGER UNIQUE,
            result credit_score_result NOT NULL,
            rating VARCHAR(50) NOT NULL,
            checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    # Recreate foreign keys
    op.execute("""
        ALTER TABLE credit_scores
        ADD CONSTRAINT credit_scores_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
    """)
    
    op.execute("""
        ALTER TABLE credit_scores
        ADD CONSTRAINT credit_scores_credit_check_id_fkey
        FOREIGN KEY (credit_check_id) REFERENCES credit_checks(id)
    """)
    
    # Create index
    op.execute("CREATE INDEX ix_credit_scores_id ON credit_scores(id)")
