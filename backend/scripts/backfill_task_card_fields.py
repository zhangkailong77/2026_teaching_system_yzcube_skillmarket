import sys
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.models.task import Task


ENTERPRISE_MAP = {
    '2026 新春国潮风格海报批量生成': '视觉灵动传媒',
    '电商产品渲染：马年限定款运动鞋': '步步高升品牌方',
    '短剧前三集特效镜头包装': '星芒影视工作室',
    '企业 IT 客服智能体搭建': '云端科技集团',
    '国风水墨 LoRA 模型训练': '古韵文化创意',
    '马年贺卡批量定制设计': '福马迎新品牌中心',
    '赛博朋克角色原画生成': '霓虹游戏网络',
    '美妆产品教程短视频混剪': '丽人美妆营销部',
}


def ensure_enterprise_name_column(db: Session) -> None:
    db.execute(
        text(
            """
            ALTER TABLE tasks
            ADD COLUMN enterprise_name VARCHAR(128) NULL
            """
        )
    )
    db.commit()


def main() -> None:
    db: Session = SessionLocal()
    try:
        try:
            ensure_enterprise_name_column(db)
            print('added column tasks.enterprise_name')
        except Exception:
            db.rollback()
            print('column tasks.enterprise_name already exists or alter skipped')

        tasks = db.query(Task).order_by(Task.id.asc()).all()
        now = datetime.utcnow()
        updated = 0
        for idx, task in enumerate(tasks):
            next_enterprise = ENTERPRISE_MAP.get(task.title, f'企业用户-{task.publisher_user_id}')
            next_deadline = now + timedelta(days=4 + (idx % 8), hours=idx % 6)
            dirty = False

            if task.enterprise_name != next_enterprise:
                task.enterprise_name = next_enterprise
                dirty = True

            if task.deadline_at is None or task.deadline_at <= now:
                task.deadline_at = next_deadline
                dirty = True

            if task.status in ('full', 'closed', 'cancelled', 'draft'):
                task.status = 'open'
                dirty = True

            if dirty:
                updated += 1

        db.commit()
        print(f'backfill done total={len(tasks)} updated={updated}')
    finally:
        db.close()


if __name__ == '__main__':
    main()
