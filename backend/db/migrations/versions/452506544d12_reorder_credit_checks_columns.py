"""reorder credit_checks columns

Revision ID: 452506544d12
Revises: a1b2c3d4e5f6
Create Date: 2026-01-20 01:51:40.681451

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '452506544d12'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Backup existing data (if any) - convert enum to text to avoid dependency
    op.execute("""
        CREATE TEMP TABLE credit_checks_backup AS
        SELECT id, user_id, mc_number, status::text as status, approved_amount,
               factor_cloud_uuid, credit_check_uuid, source,
               expiration_date, created_at, updated_at, deleted_at
        FROM credit_checks
    """)
    
    # 3. Drop the existing table
    op.execute("DROP TABLE credit_checks")
    
    # 4. Drop and recreate the enum type with name 'status' and correct value order
    op.execute("DROP TYPE IF EXISTS credit_check_status CASCADE")
    op.execute("CREATE TYPE status AS ENUM ('APPROVED', 'REVIEW_REQUIRED', 'DENIED', 'INSUFFICIENT_DATA')")
    
    # 5. Create the table with correct column order
    op.execute("""
        CREATE TABLE credit_checks (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            mc_number INTEGER NOT NULL,
            status status NOT NULL,
            approved_amount INTEGER NOT NULL,
            factor_cloud_uuid VARCHAR(255),
            credit_check_uuid VARCHAR(255) UNIQUE,
            source credit_check_source NOT NULL DEFAULT 'FactorsNetwork',
            expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            deleted_at TIMESTAMP WITH TIME ZONE
        )
    """)
    
    # 6. Restore data from backup (status is already text, cast to new enum)
    op.execute("""
        INSERT INTO credit_checks
        SELECT id, user_id, mc_number, status::status, approved_amount,
               factor_cloud_uuid, credit_check_uuid, source,
               expiration_date, created_at, updated_at, deleted_at
        FROM credit_checks_backup
    """)
    
    # 7. Recreate foreign key constraint to users
    op.execute("""
        ALTER TABLE credit_checks
        ADD CONSTRAINT credit_checks_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
    """)
    
    # 8. Recreate indexes
    op.execute("CREATE INDEX ix_credit_checks_id ON credit_checks(id)")


def downgrade() -> None:
    # 1. Backup data
    op.execute("""
        CREATE TEMP TABLE credit_checks_backup AS
        SELECT * FROM credit_checks
    """)
    
    # 3. Drop table
    op.execute("DROP TABLE credit_checks")
    
    # 4. Recreate enum type with old name
    op.execute("DROP TYPE IF EXISTS status")
    op.execute("CREATE TYPE credit_check_status AS ENUM ('REVIEW_REQUIRED', 'APPROVED', 'DENIED', 'INSUFFICIENT_DATA')")
    
    # 5. Create table with previous column order
    op.execute("""
        CREATE TABLE credit_checks (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            factor_cloud_uuid VARCHAR(255),
            credit_check_uuid VARCHAR(255) UNIQUE,
            source credit_check_source NOT NULL DEFAULT 'FactorsNetwork',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            mc_number INTEGER NOT NULL,
            status credit_check_status NOT NULL,
            approved_amount INTEGER NOT NULL,
            expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
            deleted_at TIMESTAMP WITH TIME ZONE
        )
    """)
    
    # 6. Restore data
    op.execute("""
        INSERT INTO credit_checks
        SELECT id, user_id, factor_cloud_uuid, credit_check_uuid, source,
               created_at, updated_at, mc_number, status::text::credit_check_status,
               approved_amount, expiration_date, deleted_at
        FROM credit_checks_backup
    """)
    
    # 7. Recreate constraints and indexes
    op.execute("""
        ALTER TABLE credit_checks
        ADD CONSTRAINT credit_checks_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
    """)
    
    op.execute("CREATE INDEX ix_credit_checks_id ON credit_checks(id)")
