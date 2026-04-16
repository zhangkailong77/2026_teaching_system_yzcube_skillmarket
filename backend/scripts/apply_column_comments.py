import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal


COLUMN_COMMENTS: dict[str, dict[str, str]] = {
    'users': {
        'id': '用户主键ID',
        'username': '登录账号（唯一）',
        'password_hash': '密码哈希（bcrypt）',
        'is_active': '账号是否启用',
        'created_at': '创建时间',
        'updated_at': '更新时间',
    },
    'refresh_tokens': {
        'id': '刷新令牌主键ID',
        'user_id': '关联用户ID',
        'token_hash': '刷新令牌哈希（唯一）',
        'expires_at': '刷新令牌过期时间',
        'revoked': '是否已撤销',
        'created_at': '创建时间',
    },
    'hall_users': {
        'id': '映射记录主键ID',
        'school_id': '学校/租户标识',
        'source_user_id': '教学系统用户ID',
        'username': '教学系统用户名/学号',
        'role': '教学系统角色（student/teacher等）',
        'created_at': '创建时间',
        'updated_at': '更新时间',
    },
    'tasks': {
        'id': '任务主键ID',
        'school_id': '学校/租户标识',
        'publisher_user_id': '发布者用户ID（企业端）',
        'enterprise_name': '企业名称（卡片展示）',
        'title': '任务标题',
        'category': '任务分类（comfyui/video/agent/design）',
        'description': '任务详细描述',
        'bounty_points': '任务赏金积分',
        'required_score': '最低能力分要求',
        'deadline_at': '任务截止时间',
        'status': '任务状态（draft/open/full/closed/cancelled）',
        'selection_mode': '采纳模式（single单人/multi多人）',
        'accept_quota': '最终可采纳人数N',
        'max_claimants': '历史字段：最大抢单人数（兼容保留）',
        'claimed_count': '历史字段：已抢单人数计数（兼容保留）',
        'tags_json': '任务标签JSON',
        'attachments_json': '任务附件JSON',
        'published_at': '发布时间',
        'created_at': '创建时间',
        'updated_at': '更新时间',
    },
    'task_claims': {
        'id': '接单记录主键ID',
        'task_id': '任务ID',
        'claimer_user_id': '接单用户ID',
        'claimer_school_id': '接单用户学校标识',
        'claimer_source_user_id': '接单用户教学系统ID',
        'status': '接单状态（claimed/submitted/rejected/accepted）',
        'submission_text': '交付说明文本',
        'submission_attachments_json': '交付附件JSON',
        'claimed_at': '抢单时间',
        'submitted_at': '提交交付时间',
        'reviewed_at': '企业审核时间',
        'settlement_points': '最终结算积分',
        'created_at': '创建时间',
        'updated_at': '更新时间',
    },
    'task_favorites': {
        'id': '收藏记录主键ID',
        'task_id': '任务ID',
        'user_id': '用户ID',
        'created_at': '收藏时间',
    },
    'roles': {
        'id': '角色主键ID',
        'code': '角色编码（唯一）',
        'name': '角色名称',
        'description': '角色描述',
        'is_system': '是否系统内置角色',
        'created_at': '创建时间',
        'updated_at': '更新时间',
    },
    'permissions': {
        'id': '权限主键ID',
        'code': '权限编码（唯一）',
        'name': '权限名称',
        'module': '权限模块',
        'description': '权限描述',
        'created_at': '创建时间',
        'updated_at': '更新时间',
    },
    'role_permissions': {
        'id': '角色权限关系主键ID',
        'role_id': '角色ID',
        'permission_id': '权限ID',
        'created_at': '创建时间',
    },
    'user_roles': {
        'id': '用户角色关系主键ID',
        'user_id': '用户ID',
        'role_id': '角色ID',
        'is_active': '关系是否启用',
        'assigned_by_user_id': '分配人用户ID',
        'created_at': '创建时间',
    },
    'audit_logs': {
        'id': '审计日志主键ID',
        'actor_user_id': '操作人用户ID',
        'actor_role_code': '操作人角色编码',
        'action': '操作动作编码',
        'resource_type': '资源类型',
        'resource_id': '资源ID',
        'payload_json': '审计上下文JSON',
        'ip': '请求来源IP',
        'user_agent': '客户端UA',
        'created_at': '创建时间',
    },
}


def _quote_default(value: object | None) -> str:
    if value is None:
        return 'DEFAULT NULL'
    raw = str(value)
    lowered = raw.lower()
    if (
        lowered.startswith('current_timestamp')
        or lowered == 'now()'
        or lowered == 'current_timestamp()'
        or lowered == 'curdate()'
        or lowered == 'curtime()'
    ):
        if lowered in {'now()', 'current_timestamp()'}:
            return 'DEFAULT CURRENT_TIMESTAMP'
        return f'DEFAULT {raw}'
    escaped = raw.replace("'", "''")
    return f"DEFAULT '{escaped}'"


def _build_modify_sql(
    table_name: str,
    column_name: str,
    column_type: str,
    nullable: bool,
    default_value: object | None,
    extra: str,
    comment: str,
) -> str:
    null_sql = 'NULL' if nullable else 'NOT NULL'
    default_sql = _quote_default(default_value) if (nullable or default_value is not None) else ''
    extra_sql = extra.strip()
    if extra_sql:
        # SHOW FULL COLUMNS can contain metadata-only markers that are not valid in MODIFY.
        extra_sql = extra_sql.replace('DEFAULT_GENERATED', '').strip()
    safe_comment = comment.replace("'", "''")
    parts = [
        f"ALTER TABLE `{table_name}` MODIFY COLUMN `{column_name}` {column_type}",
        null_sql,
    ]
    if default_sql:
        parts.append(default_sql)
    if extra_sql:
        parts.append(extra_sql)
    parts.append(f"COMMENT '{safe_comment}'")
    return ' '.join(parts)


def main() -> None:
    db: Session = SessionLocal()
    try:
        updated = 0
        skipped = 0
        for table_name, fields in COLUMN_COMMENTS.items():
            full_rows = db.execute(text(f"SHOW FULL COLUMNS FROM `{table_name}`")).mappings().all()
            current = {str(row['Field']): row for row in full_rows}
            for column_name, comment in fields.items():
                row = current.get(column_name)
                if not row:
                    skipped += 1
                    print(f'skip missing column {table_name}.{column_name}')
                    continue
                sql = _build_modify_sql(
                    table_name=table_name,
                    column_name=column_name,
                    column_type=str(row['Type']),
                    nullable=str(row['Null']).upper() == 'YES',
                    default_value=row['Default'],
                    extra=str(row['Extra'] or ''),
                    comment=comment,
                )
                db.execute(text(sql))
                updated += 1
        db.commit()
        print(f'updated column comments: {updated}, skipped: {skipped}')
    finally:
        db.close()


if __name__ == '__main__':
    main()
