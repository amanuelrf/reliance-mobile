"""restructure credit checks

Revision ID: a1b2c3d4e5f6
Revises: 6dde4f9f9da9
Create Date: 2026-01-19 20:00:00.000000

"""
from typing import Sequence, Union
from datetime import datetime, timedelta

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6dde4f9f9da9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types for PostgreSQL (if they don't exist)
    op.execute("DO $$ BEGIN CREATE TYPE credit_check_status AS ENUM ('REVIEW_REQUIRED', 'APPROVED', 'DENIED', 'INSUFFICIENT_DATA'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE credit_check_source AS ENUM ('FactorsNetwork', 'TransCredit', 'Ansonia'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Add new columns first (with temporary defaults for NOT NULL)
    op.add_column('credit_checks', sa.Column('mc_number_new', sa.Integer(), nullable=True))
    op.add_column('credit_checks', sa.Column('status', sa.Enum('REVIEW_REQUIRED', 'APPROVED', 'DENIED', 'INSUFFICIENT_DATA', name='credit_check_status', create_type=False), nullable=True))
    op.add_column('credit_checks', sa.Column('approved_amount', sa.Integer(), nullable=True))
    op.add_column('credit_checks', sa.Column('expiration_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('credit_checks', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    
    # Migrate data: convert broker_mc_number to integer, copy result to status
    op.execute("""
        UPDATE credit_checks 
        SET mc_number_new = CAST(broker_mc_number AS INTEGER),
            status = result::text::credit_check_status,
            approved_amount = CASE 
                WHEN result::text = 'APPROVED' THEN 10000
                WHEN result::text = 'REVIEW_REQUIRED' THEN 5000
                ELSE 0
            END,
            expiration_date = CASE
                WHEN result::text = 'APPROVED' THEN NOW() + INTERVAL '90 days'
                WHEN result::text = 'REVIEW_REQUIRED' THEN NOW() + INTERVAL '30 days'
                ELSE NOW() + INTERVAL '7 days'
            END
        WHERE broker_mc_number IS NOT NULL AND broker_mc_number != ''
    """)
    
    # Set defaults for rows where broker_mc_number was NULL
    op.execute("""
        UPDATE credit_checks 
        SET mc_number_new = 0,
            status = COALESCE(result::text::credit_check_status, 'INSUFFICIENT_DATA'::credit_check_status),
            approved_amount = 0,
            expiration_date = NOW() + INTERVAL '7 days'
        WHERE mc_number_new IS NULL
    """)
    
    # Make new columns NOT NULL
    op.alter_column('credit_checks', 'mc_number_new', nullable=False)
    op.alter_column('credit_checks', 'status', nullable=False)
    op.alter_column('credit_checks', 'approved_amount', nullable=False)
    op.alter_column('credit_checks', 'expiration_date', nullable=False)
    
    # Drop old columns
    op.drop_column('credit_checks', 'broker_name')
    op.drop_column('credit_checks', 'broker_mc_number')
    op.drop_column('credit_checks', 'broker_dot_number')
    op.drop_column('credit_checks', 'result')
    
    # Rename mc_number_new to mc_number
    op.execute("ALTER TABLE credit_checks RENAME COLUMN mc_number_new TO mc_number")
    
    # Change source to ENUM
    op.execute("ALTER TABLE credit_checks ALTER COLUMN source TYPE credit_check_source USING source::credit_check_source")
    op.alter_column('credit_checks', 'source', nullable=False, server_default='FactorsNetwork')
    
    # Set default source for existing rows
    op.execute("UPDATE credit_checks SET source = 'FactorsNetwork'::credit_check_source WHERE source IS NULL OR source NOT IN ('FactorsNetwork', 'TransCredit', 'Ansonia')")


def downgrade() -> None:
    # Change source back to VARCHAR
    op.execute("ALTER TABLE credit_checks ALTER COLUMN source TYPE VARCHAR(100) USING source::text")
    op.alter_column('credit_checks', 'source', nullable=True)
    
    # Add back old columns
    op.add_column('credit_checks', sa.Column('broker_name', sa.String(255), nullable=True))
    op.add_column('credit_checks', sa.Column('broker_mc_number', sa.String(64), nullable=True))
    op.add_column('credit_checks', sa.Column('broker_dot_number', sa.String(64), nullable=True))
    op.execute("CREATE TYPE credit_check_result AS ENUM ('REVIEW_REQUIRED', 'APPROVED', 'DENIED', 'INSUFFICIENT_DATA')")
    op.add_column('credit_checks', sa.Column('result', sa.Enum('REVIEW_REQUIRED', 'APPROVED', 'DENIED', 'INSUFFICIENT_DATA', name='credit_check_result', create_type=False), nullable=True))
    
    # Migrate data back
    op.execute("""
        UPDATE credit_checks 
        SET broker_mc_number = CAST(mc_number AS VARCHAR),
            result = status::credit_check_result,
            broker_name = 'Unknown'
    """)
    
    # Make result NOT NULL
    op.alter_column('credit_checks', 'result', nullable=False)
    op.alter_column('credit_checks', 'broker_name', nullable=False)
    
    # Drop new columns
    op.drop_column('credit_checks', 'mc_number')
    op.drop_column('credit_checks', 'status')
    op.drop_column('credit_checks', 'approved_amount')
    op.drop_column('credit_checks', 'expiration_date')
    op.drop_column('credit_checks', 'deleted_at')
    
    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS credit_check_status")
    op.execute("DROP TYPE IF EXISTS credit_check_source")
    op.execute("DROP TYPE IF EXISTS credit_check_result")
