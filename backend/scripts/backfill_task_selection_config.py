import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.models.task import Task


def ensure_selection_columns(db: Session) -> None:
    db.execute(
        text(
            """
            ALTER TABLE tasks
            ADD COLUMN selection_mode VARCHAR(20) NOT NULL DEFAULT 'single'
            """
        )
    )
    db.commit()
    db.execute(
        text(
            """
            ALTER TABLE tasks
            ADD COLUMN accept_quota INT NOT NULL DEFAULT 1
            """
        )
    )
    db.commit()


def main() -> None:
    db: Session = SessionLocal()
    try:
        try:
            ensure_selection_columns(db)
            print('added columns tasks.selection_mode/tasks.accept_quota')
        except Exception:
            db.rollback()
            print('columns tasks.selection_mode/tasks.accept_quota already exist or alter skipped')

        tasks = db.query(Task).order_by(Task.id.asc()).all()
        updated = 0
        for task in tasks:
            target_quota = 1
            if (task.max_claimants or 0) > 1:
                target_quota = task.max_claimants

            target_mode = 'multi' if target_quota > 1 else 'single'
            dirty = False

            if task.accept_quota != target_quota:
                task.accept_quota = target_quota
                dirty = True
            if task.selection_mode != target_mode:
                task.selection_mode = target_mode
                dirty = True
            if dirty:
                updated += 1

        db.commit()
        print(f'backfill done total={len(tasks)} updated={updated}')
    finally:
        db.close()


if __name__ == '__main__':
    main()
