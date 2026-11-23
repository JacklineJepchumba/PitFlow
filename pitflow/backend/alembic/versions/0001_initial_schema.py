"""initial schema for Pit Sidecar tables

Revision ID: 0001
Revises:
Create Date: 2026-11-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False, unique=True),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("role IN ('admin', 'care_worker')", name="ck_users_role"),
    )

    op.create_table(
        "sites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("area", sa.String(120), nullable=False),
        sa.Column(
            "location",
            Geography(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("notes", sa.Text()),
    )

    op.create_table(
        "units",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(32), nullable=False, unique=True),
        sa.Column("site_id", sa.Integer(), sa.ForeignKey("sites.id"), nullable=False),
        sa.Column("capacity_users", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("design", sa.String(16), nullable=False, server_default="wide"),
        sa.Column("status", sa.String(16), nullable=False, server_default="green"),
        sa.Column("last_reading_at", sa.DateTime(timezone=True)),
        sa.Column("last_visited_at", sa.DateTime(timezone=True)),
        sa.Column("installed_on", sa.Date()),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.CheckConstraint("design IN ('wide', 'tall')", name="ck_units_design"),
        sa.CheckConstraint("status IN ('green', 'amber', 'red')", name="ck_units_status"),
    )

    op.create_table(
        "caretakers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False, unique=True),
        sa.Column("site_id", sa.Integer(), sa.ForeignKey("sites.id"), nullable=False),
    )

    op.create_table(
        "readings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("unit_id", sa.Integer(), sa.ForeignKey("units.id"), nullable=False),
        sa.Column("caretaker_id", sa.Integer(), sa.ForeignKey("caretakers.id")),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(16), nullable=False),
        sa.Column("raw_message", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("level IN (1, 2, 3)", name="ck_readings_level"),
        sa.CheckConstraint(
            "source IN ('sms', 'ussd', 'manual')", name="ck_readings_source"
        ),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("unit_id", sa.Integer(), sa.ForeignKey("units.id"), nullable=False),
        sa.Column("reason", sa.String(16), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="open"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("reason IN ('amber', 'red', 'overdue')", name="ck_jobs_reason"),
        sa.CheckConstraint(
            "status IN ('open', 'assigned', 'done')", name="ck_jobs_status"
        ),
    )

    op.create_table(
        "trips",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("care_worker_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("scheduled_for", sa.Date(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="planned"),
        sa.Column("payment_kes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('planned', 'in_progress', 'done', 'paid')",
            name="ck_trips_status",
        ),
    )

    op.create_table(
        "trip_stops",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("trip_id", sa.Integer(), sa.ForeignKey("trips.id"), nullable=False),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("stop_order", sa.Integer(), nullable=False),
        sa.Column("visited_at", sa.DateTime(timezone=True)),
        sa.Column(
            "bedding_topped", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "pad_bin_emptied",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("notes", sa.Text()),
        sa.UniqueConstraint("trip_id", "job_id", name="uq_trip_job"),
    )

    op.create_table(
        "batches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("unit_id", sa.Integer(), sa.ForeignKey("units.id"), nullable=False),
        sa.Column("trip_stop_id", sa.Integer(), sa.ForeignKey("trip_stops.id")),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column(
            "removed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("destination", sa.String(120)),
        sa.Column("tested", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.Text()),
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "trip_id", sa.Integer(), sa.ForeignKey("trips.id"), nullable=False, unique=True
        ),
        sa.Column("amount_kes", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="owed"),
        sa.Column("paid_at", sa.DateTime(timezone=True)),
        sa.Column("reference", sa.String(120)),
        sa.CheckConstraint("status IN ('owed', 'paid')", name="ck_payments_status"),
    )

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("kind", sa.String(64), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("prev_hash", sa.String(64), nullable=False),
        sa.Column("hash", sa.String(64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_events_hash", "events", ["hash"])


def downgrade() -> None:
    op.drop_index("ix_events_hash", table_name="events")
    op.drop_table("events")
    op.drop_table("payments")
    op.drop_table("batches")
    op.drop_table("trip_stops")
    op.drop_table("trips")
    op.drop_table("jobs")
    op.drop_table("readings")
    op.drop_table("caretakers")
    op.drop_table("units")
    op.drop_table("sites")
    op.drop_table("users")
