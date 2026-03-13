import argparse
import sys
from pathlib import Path

from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.models.hall_user import HallUser
from app.models.rbac import Role, UserRole
from app.models.user import User


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Backfill user roles for existing users.')
    parser.add_argument('--super-username', type=str, default='', help='Optional username to ensure super_admin role')
    parser.add_argument('--dry-run', action='store_true', help='Only print planned changes')
    return parser.parse_args()


def ensure_user_role(db: Session, *, user_id: int, role_id: int, dry_run: bool) -> bool:
    existing = db.query(UserRole).filter(UserRole.user_id == user_id, UserRole.role_id == role_id).first()
    if existing is not None:
        if not existing.is_active and not dry_run:
            existing.is_active = True
        return False
    if not dry_run:
        db.add(UserRole(user_id=user_id, role_id=role_id, is_active=True))
    return True


def main() -> None:
    args = parse_args()
    db: Session = SessionLocal()
    try:
        role_map = {role.code: role for role in db.query(Role).all()}
        required = ['super_admin', 'school_member', 'enterprise_member']
        missing_roles = [code for code in required if code not in role_map]
        if missing_roles:
            raise ValueError(f'missing roles: {",".join(missing_roles)}; run scripts/seed_rbac.py first')

        school_role_id = role_map['school_member'].id
        enterprise_role_id = role_map['enterprise_member'].id
        super_role_id = role_map['super_admin'].id

        school_usernames = {name for (name,) in db.query(HallUser.username).distinct().all()}
        users = db.query(User).all()

        added_school = 0
        added_enterprise = 0
        added_super = 0

        for user in users:
            if user.username in school_usernames:
                if ensure_user_role(db, user_id=user.id, role_id=school_role_id, dry_run=args.dry_run):
                    added_school += 1
            else:
                if ensure_user_role(db, user_id=user.id, role_id=enterprise_role_id, dry_run=args.dry_run):
                    added_enterprise += 1

        if args.super_username.strip():
            super_user = db.query(User).filter(User.username == args.super_username.strip()).first()
            if super_user is None:
                raise ValueError(f'super user not found: {args.super_username}')
            if ensure_user_role(db, user_id=super_user.id, role_id=super_role_id, dry_run=args.dry_run):
                added_super += 1

        if not args.dry_run:
            db.commit()

        print(
            'backfill done '
            f'dry_run={args.dry_run} '
            f'added_school_member={added_school} '
            f'added_enterprise_member={added_enterprise} '
            f'added_super_admin={added_super}'
        )
    finally:
        db.close()


if __name__ == '__main__':
    main()
