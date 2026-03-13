import argparse
import sys
from pathlib import Path

from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.core.security import hash_password
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.user import User

PERMISSIONS = [
    ('admin.read', '管理员查看', 'admin'),
    ('admin.create', '管理员创建', 'admin'),
    ('admin.update', '管理员修改', 'admin'),
    ('admin.reset_password', '管理员重置密码', 'admin'),
    ('role.read', '角色查看', 'rbac'),
    ('role.manage', '角色管理', 'rbac'),
    ('permission.read', '权限查看', 'rbac'),
    ('permission.manage', '权限管理', 'rbac'),
    ('task.read', '任务查看', 'task'),
    ('task.audit', '任务审核', 'task'),
    ('task.close', '任务下架', 'task'),
    ('task.reopen', '任务恢复', 'task'),
    ('task.appeal.handle', '申诉处理', 'task'),
    ('user.read', '用户查看', 'user'),
    ('user.ban', '用户封禁', 'user'),
    ('enterprise.read', '企业查看', 'enterprise'),
    ('enterprise.verify', '企业认证审核', 'enterprise'),
    ('enterprise.posting.manage', '企业发单权限管理', 'enterprise'),
    ('notice.read', '公告查看', 'notice'),
    ('notice.publish', '公告发布', 'notice'),
    ('notice.revoke', '公告撤回', 'notice'),
    ('system.config.read', '系统配置查看', 'system'),
    ('system.config.update', '系统配置修改', 'system'),
    ('audit.read', '审计日志查看', 'audit'),
    ('audit.export', '审计日志导出', 'audit'),
    ('hall.task.read', '任务广场浏览', 'hall'),
    ('hall.task.claim', '任务接单', 'hall'),
    ('hall.task.submit', '任务交付提交', 'hall'),
    ('hall.profile.read', '个人资料查看', 'hall'),
    ('enterprise.task.create', '企业发布任务', 'enterprise'),
    ('enterprise.task.read', '企业任务查看', 'enterprise'),
    ('enterprise.task.update', '企业任务编辑', 'enterprise'),
    ('enterprise.task.close', '企业任务关闭', 'enterprise'),
    ('enterprise.delivery.read', '企业交付查看', 'enterprise'),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Seed RBAC roles/permissions and bind super admin user.')
    parser.add_argument('--super-username', type=str, default='', help='Designated super admin username')
    parser.add_argument('--super-password', type=str, default='', help='Designated super admin password')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db: Session = SessionLocal()
    try:
        role_super = db.query(Role).filter(Role.code == 'super_admin').first()
        if role_super is None:
            role_super = Role(code='super_admin', name='超级管理员', description='全平台最高权限', is_system=True)
            db.add(role_super)

        role_sub = db.query(Role).filter(Role.code == 'sub_admin').first()
        if role_sub is None:
            role_sub = Role(code='sub_admin', name='子管理员', description='业务管理权限', is_system=True)
            db.add(role_sub)

        role_school_member = db.query(Role).filter(Role.code == 'school_member').first()
        if role_school_member is None:
            role_school_member = Role(
                code='school_member',
                name='校内成员',
                description='学生与老师统一业务角色',
                is_system=True,
            )
            db.add(role_school_member)

        role_enterprise_member = db.query(Role).filter(Role.code == 'enterprise_member').first()
        if role_enterprise_member is None:
            role_enterprise_member = Role(
                code='enterprise_member',
                name='企业成员',
                description='企业业务角色',
                is_system=True,
            )
            db.add(role_enterprise_member)
        db.commit()

        permission_map: dict[str, Permission] = {}
        for code, name, module in PERMISSIONS:
            permission = db.query(Permission).filter(Permission.code == code).first()
            if permission is None:
                permission = Permission(code=code, name=name, module=module)
                db.add(permission)
                db.flush()
            permission_map[code] = permission
        db.commit()

        super_codes = [code for code, _, _ in PERMISSIONS]
        sub_codes = [
            'task.read',
            'task.audit',
            'task.close',
            'task.reopen',
            'task.appeal.handle',
            'user.read',
            'user.ban',
            'enterprise.read',
            'enterprise.verify',
            'enterprise.posting.manage',
            'notice.read',
            'notice.publish',
            'notice.revoke',
            'audit.read',
        ]
        school_member_codes = [
            'hall.task.read',
            'hall.task.claim',
            'hall.task.submit',
            'hall.profile.read',
        ]
        enterprise_member_codes = [
            'hall.task.read',
            'enterprise.task.create',
            'enterprise.task.read',
            'enterprise.task.update',
            'enterprise.task.close',
            'enterprise.delivery.read',
        ]

        for code in super_codes:
            exists = db.query(RolePermission).filter(
                RolePermission.role_id == role_super.id, RolePermission.permission_id == permission_map[code].id
            ).first()
            if exists is None:
                db.add(RolePermission(role_id=role_super.id, permission_id=permission_map[code].id))

        for code in sub_codes:
            exists = db.query(RolePermission).filter(
                RolePermission.role_id == role_sub.id, RolePermission.permission_id == permission_map[code].id
            ).first()
            if exists is None:
                db.add(RolePermission(role_id=role_sub.id, permission_id=permission_map[code].id))

        for code in school_member_codes:
            exists = db.query(RolePermission).filter(
                RolePermission.role_id == role_school_member.id,
                RolePermission.permission_id == permission_map[code].id,
            ).first()
            if exists is None:
                db.add(RolePermission(role_id=role_school_member.id, permission_id=permission_map[code].id))

        for code in enterprise_member_codes:
            exists = db.query(RolePermission).filter(
                RolePermission.role_id == role_enterprise_member.id,
                RolePermission.permission_id == permission_map[code].id,
            ).first()
            if exists is None:
                db.add(RolePermission(role_id=role_enterprise_member.id, permission_id=permission_map[code].id))
        db.commit()

        super_user: User | None = None
        if args.super_username.strip():
            super_user = db.query(User).filter(User.username == args.super_username.strip()).first()
            if super_user is None:
                if not args.super_password.strip():
                    raise ValueError('super user does not exist, --super-password is required to create it')
                super_user = User(
                    username=args.super_username.strip(),
                    password_hash=hash_password(args.super_password),
                    is_active=True,
                )
                db.add(super_user)
                db.commit()
                db.refresh(super_user)
        else:
            super_user = db.query(User).order_by(User.id.asc()).first()

        if super_user:
            user_role = db.query(UserRole).filter(
                UserRole.user_id == super_user.id,
                UserRole.role_id == role_super.id,
            ).first()
            if user_role is None:
                db.add(UserRole(user_id=super_user.id, role_id=role_super.id, is_active=True))
                db.commit()
            print(f'seed done, super_admin user_id={super_user.id}, username={super_user.username}')
        else:
            print('seed done, no user found; please assign super_admin manually')
    finally:
        db.close()


if __name__ == '__main__':
    main()
