from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


SCHEMA_SYNC_SQL = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS real_name VARCHAR(64)",
    "ALTER TABLE alumnus_info ADD COLUMN IF NOT EXISTS class_name VARCHAR(64)",
    "ALTER TABLE alumnus_info ADD COLUMN IF NOT EXISTS current_university VARCHAR(128)",
    "ALTER TABLE alumnus_info ADD COLUMN IF NOT EXISTS current_college VARCHAR(128)",
    "ALTER TABLE alumnus_info ADD COLUMN IF NOT EXISTS current_major VARCHAR(128)",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS teacher_id INTEGER",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS teacher_comment TEXT",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS teacher_reviewed_at TIMESTAMP",
]


async def run_schema_sync(engine: AsyncEngine):
    async with engine.begin() as conn:
        for sql in SCHEMA_SYNC_SQL:
            await conn.execute(text(sql))
