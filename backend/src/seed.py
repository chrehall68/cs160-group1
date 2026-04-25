# sidecar script for inserting data
import hashlib
import logging
import os
import sys
from pathlib import Path
from typing import Optional

from sqlalchemy import Engine, create_engine, text
from sqlmodel import Session, SQLModel, select

from dependencies.db import build_database_url
from models import SeedHistory

logger = logging.getLogger("uvicorn.error")

# stable id for pg_advisory_xact_lock used by the seed runner.
# all seed-runner invocations must agree on this so they serialize cleanly.
SEED_LOCK_ID = 7160160160160160160


def run_seed(engine: Engine, seed_file_path: Optional[str]) -> None:
    if not seed_file_path:
        logger.info("seed: no SEED_FILE configured, skipping")
        return

    path = Path(seed_file_path)
    if not path.is_file():
        logger.info("seed: file %s not found, skipping", seed_file_path)
        return

    sql_bytes = path.read_bytes()
    sha256 = hashlib.sha256(sql_bytes).hexdigest()
    filename = path.name

    with Session(engine) as session:
        session.execute(
            text("SELECT pg_advisory_xact_lock(:id)"),
            {"id": SEED_LOCK_ID},
        )
        SQLModel.metadata.create_all(bind=session.connection())

        existing = session.exec(
            select(SeedHistory).where(
                SeedHistory.filename == filename,
                SeedHistory.sha256 == sha256,
            )
        ).first()
        if existing is not None:
            logger.info(
                "seed: %s (sha256=%s) already applied, skipping",
                filename,
                sha256,
            )
            session.commit()
            return

        logger.info("seed: applying %s (sha256=%s)", filename, sha256)
        sql_text = sql_bytes.decode("utf-8")
        # strip psql-only backslash meta-commands (e.g. \restrict, \unrestrict, \connect)
        # that pg_dump emits but psycopg cannot parse
        sql_text = "\n".join(
            line for line in sql_text.splitlines() if not line.lstrip().startswith("\\")
        )
        session.connection().exec_driver_sql(sql_text)
        # pg_dump clears search_path; restore it so unqualified inserts (e.g. SeedHistory) resolve
        session.execute(
            text("SELECT pg_catalog.set_config('search_path', 'public', false)")
        )
        session.add(SeedHistory(filename=filename, sha256=sha256))
        session.commit()
        logger.info("seed: %s applied successfully", filename)


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    seed_file = os.getenv("SEED_FILE", "").strip() or None
    engine = create_engine(build_database_url())
    try:
        run_seed(engine, seed_file)
    finally:
        engine.dispose()
    return 0


if __name__ == "__main__":
    sys.exit(main())
