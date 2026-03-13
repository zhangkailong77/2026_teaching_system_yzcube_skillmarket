import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  ClipboardCheck,
  FileWarning,
  LayoutDashboard,
  List,
  LogOut,
  MonitorSmartphone,
  Moon,
  Search,
  Settings,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';

const pendingTasks = [
  {
    id: 'T-20260313-001',
    title: '马年贺卡批量定制设计',
    enterprise: '颜值立方品牌中心',
    creator: '18250636865',
    createdAt: '2026-03-13 09:41',
    risk: '低',
    bounty: 800,
  },
  {
    id: 'T-20260313-002',
    title: '企业 IT 客服智能体搭建',
    enterprise: '运维平台组',
    creator: '18250636868',
    createdAt: '2026-03-13 10:05',
    risk: '中',
    bounty: 3000,
  },
  {
    id: 'T-20260313-003',
    title: '短剧前三集特效镜头包装',
    enterprise: '新媒体工作室',
    creator: '18250636869',
    createdAt: '2026-03-13 11:22',
    risk: '高',
    bounty: 5000,
  },
];

function isAdminRole(roles: string[]): boolean {
  return roles.includes('super_admin') || roles.includes('sub_admin');
}

export default function AdminConsoleView() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const roles = (() => {
    try {
      const raw = localStorage.getItem('yzcube_auth_roles');
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  })();

  if (!isAdminRole(roles)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl mx-auto bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
            <Shield size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">无后台访问权限</h2>
          <p className="text-sm text-slate-500">当前账号不是管理员角色，请使用 `super_admin` 或 `sub_admin` 账号登录。</p>
        </div>
      </div>
    );
  }

  const username = localStorage.getItem('yzcube_auth_username') || 'admin';
  const logoSrc = new URL('../assets/home/logo.png', import.meta.url).href;

  const handleLogout = () => {
    localStorage.removeItem('yzcube_access_token');
    localStorage.removeItem('yzcube_refresh_token');
    localStorage.removeItem('yzcube_auth_username');
    localStorage.removeItem('yzcube_auth_roles');
    window.location.replace('/hall');
  };

  useEffect(() => {
    if (!showUserMenu) {
      return;
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!userMenuRef.current?.contains(target)) {
        setShowUserMenu(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [showUserMenu]);

  return (
    <div className="flex h-screen bg-[#F4F7FB] text-slate-800 font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-blue-100/50 flex flex-col flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="relative h-10 w-10 flex items-center justify-center">
              <span className="logo-breathing-halo absolute inset-0 rounded-full" aria-hidden="true" />
              <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-blue-300 bg-white shadow-sm z-10">
                {!logoLoadError ? (
                  <img
                    src={logoSrc}
                    alt="企业任务大厅 Logo"
                    className="h-full w-full object-cover"
                    onError={() => setLogoLoadError(true)}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Briefcase size={18} className="fill-blue-600 text-blue-600" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">Yzcube SkillMarket</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">管理后台</div>
            <nav className="space-y-1">
              {[
                { icon: LayoutDashboard, label: '工作台总览', active: true },
                { icon: ClipboardCheck, label: '任务审核' },
                { icon: Users, label: '用户管理' },
                { icon: Building2, label: '企业管理' },
                { icon: Bell, label: '公告管理' },
                { icon: UserCog, label: '管理员中心' },
                { icon: Settings, label: '系统配置' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    item.active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">快速入口</div>
            <nav className="space-y-1">
              {[
                { icon: FileWarning, label: '高风险待审任务', active: false },
                { icon: AlertTriangle, label: '异常行为告警', active: false },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-slate-400">
          <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><Moon size={18} /></button>
          <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><MonitorSmartphone size={18} /></button>
          <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><List size={18} /></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="搜索任务ID/企业/发布者/风险事件..."
                className="w-full bg-slate-100/80 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 rounded-full py-2 pl-10 pr-4 text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 ml-6">
            <button className="text-slate-500 hover:text-blue-600 relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="relative" ref={userMenuRef}>
              {[
                <button
                  type="button"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl px-2 py-1.5 cursor-pointer hover:bg-blue-50/70 transition-colors"
                >
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-slate-800">{username}</div>
                    <div className="text-[11px] text-blue-600">管理员</div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
                    {(username[0] || 'A').toUpperCase()}
                  </div>
                </button>,
              ]}
              {showUserMenu && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 rounded-2xl border border-white/70 bg-white/98 backdrop-blur-xl shadow-[0_22px_48px_rgba(15,23,42,0.18)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/70 bg-gradient-to-r from-white/35 to-blue-50/55">
                    <div className="text-sm font-bold text-slate-800">{username}</div>
                    <div className="mt-1 text-[11px] text-blue-700/90">管理员权限已启用</div>
                  </div>
                  <div className="px-2 py-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
                    >
                      <LogOut size={15} />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">管理员工作台</h2>
            <p className="text-sm text-slate-500 mt-1">统一管理任务审核、用户风控、企业认证与平台公告。</p>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: '待审核任务', value: '18', icon: ClipboardCheck, trend: '+6' },
              { label: '今日新增企业', value: '5', icon: Building2, trend: '+2' },
              { label: '异常告警', value: '3', icon: AlertTriangle, trend: '-1' },
              { label: '活跃管理员', value: '4', icon: Activity, trend: '稳定' },
            ].map((card) => (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500">{card.label}</span>
                  <card.icon size={16} className="text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{card.value}</div>
                <div className="text-xs text-emerald-600 mt-1">{card.trend}</div>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <article className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">待审核任务</h3>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  查看全部
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-slate-500">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">任务</th>
                      <th className="text-left px-4 py-3 font-medium">企业/发布者</th>
                      <th className="text-left px-4 py-3 font-medium">赏金</th>
                      <th className="text-left px-4 py-3 font-medium">风险</th>
                      <th className="text-left px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTasks.map((task) => (
                      <tr key={task.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{task.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{task.id} · {task.createdAt}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{task.enterprise}</div>
                          <div className="text-xs text-slate-400">{task.creator}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{task.bounty}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              task.risk === '高'
                                ? 'bg-rose-100 text-rose-600'
                                : task.risk === '中'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {task.risk}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button type="button" className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                              审核
                            </button>
                            <button type="button" className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                              驳回
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">系统动态</h3>
              <div className="space-y-3">
                {[
                  '企业 “运维平台组” 提交了新的认证资料',
                  '用户 18250636869 触发异常行为告警',
                  '公告 “版权合规通知” 已发布成功',
                ].map((item) => (
                  <div key={item} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Briefcase size={14} className="text-blue-600" />
                  快捷操作
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="rounded-lg bg-blue-50 text-blue-700 border border-blue-200 py-2 text-xs font-semibold hover:bg-blue-100">发布公告</button>
                  <button type="button" className="rounded-lg bg-slate-50 text-slate-700 border border-slate-200 py-2 text-xs font-semibold hover:bg-slate-100">导出日志</button>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
