from fastapi import APIRouter, Depends

from app.api.deps.admin_auth import require_permissions
from app.models.user import User

router = APIRouter(prefix='/admin', tags=['admin'])


@router.get('/dashboard')
def admin_dashboard(current_user: User = Depends(require_permissions('task.read'))) -> dict:
    return {
        'ok': True,
        'message': 'admin access granted',
        'user_id': current_user.id,
    }
