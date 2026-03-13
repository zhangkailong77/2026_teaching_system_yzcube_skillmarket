-- Table comments for yzcube_skillmarket

ALTER TABLE `users` COMMENT = '平台用户主表（企业账号/本地账号）';
ALTER TABLE `refresh_tokens` COMMENT = '登录刷新令牌表';
ALTER TABLE `hall_users` COMMENT = '教学系统用户映射表（SSO来源用户）';

ALTER TABLE `tasks` COMMENT = '任务主表（任务广场展示与接单来源）';
ALTER TABLE `task_claims` COMMENT = '任务接单与交付状态表';
ALTER TABLE `task_favorites` COMMENT = '任务收藏关系表';

ALTER TABLE `roles` COMMENT = 'RBAC角色定义表';
ALTER TABLE `permissions` COMMENT = 'RBAC权限点定义表';
ALTER TABLE `role_permissions` COMMENT = '角色-权限绑定表';
ALTER TABLE `user_roles` COMMENT = '用户-角色绑定表';
ALTER TABLE `audit_logs` COMMENT = '后台审计日志表';
