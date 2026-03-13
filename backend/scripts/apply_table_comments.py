import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal

TABLE_COMMENTS: dict[str, str] = {
    'users': '平台用户主表（企业账号/本地账号）',
    'refresh_tokens': '登录刷新令牌表',
    'hall_users': '教学系统用户映射表（SSO来源用户）',
    'tasks': '任务主表（任务广场展示与接单来源）',
    'task_claims': '任务接单与交付状态表',
    'task_favorites': '任务收藏关系表',
    'roles': 'RBAC角色定义表',
    'permissions': 'RBAC权限点定义表',
    'role_permissions': '角色-权限绑定表',
    'user_roles': '用户-角色绑定表',
    'audit_logs': '后台审计日志表',
}


def main() -> None:
    db: Session = SessionLocal()
    try:
        for table_name, comment in TABLE_COMMENTS.items():
            safe_comment = comment.replace("'", "''")
            sql = f"ALTER TABLE `{table_name}` COMMENT = '{safe_comment}'"
            db.execute(text(sql))
        db.commit()
        print(f'updated table comments: {len(TABLE_COMMENTS)}')
    finally:
        db.close()


if __name__ == '__main__':
    main()
