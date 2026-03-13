import { useEffect, useRef, useState, type FormEvent } from 'react';
import { 
  Search, Home, Briefcase, FolderOpen, Wallet, PlusSquare, 
  Bell, User, ChevronRight, Filter, Zap, Star, Clock, 
  Award, Flame, Sparkles, LayoutGrid, Moon, MonitorSmartphone, List,
  CheckCircle2, AlertCircle, Play, FileText, MoreHorizontal,
  Eye, EyeOff, Heart, Lock, Globe, Plus, Image as ImageIcon, Video, UploadCloud,
  TrendingUp, TrendingDown, CreditCard, Receipt, PieChart,
  Trophy, Target, ShieldCheck, Hexagon, Medal, Settings, LogOut
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import LoginModal, { type AuthMode, type RegisterFormState } from '../login/LoginModal';
import { getMe, login, registerEnterprise } from '../../services/auth';
import { fetchTasks, type TaskListItem } from '../../services/tasks';

// --- Mock Data: Task Hall ---
const CATEGORIES = [
  { id: 'all', name: '全部任务', icon: <LayoutGrid size={16} /> },
  { id: 'comfyui', name: 'ComfyUI 工作流', icon: <Sparkles size={16} />, badge: '热门' },
  { id: 'video', name: '短视频剪辑', icon: <MonitorSmartphone size={16} /> },
  { id: 'agent', name: '客服智能体', icon: <Zap size={16} />, badge: '新赛道' },
  { id: 'design', name: '平面视觉设计', icon: <Star size={16} /> },
];

const TASKS = [
  {
    id: 1,
    title: '2026 新春国潮风格海报批量生成',
    enterprise: '视觉灵动传媒',
    bounty: 2500,
    type: 'ComfyUI',
    image: 'https://picsum.photos/seed/newyear/400/600',
    tags: ['图像生成', '高赏金'],
    reqScore: 80,
    deadlineAt: '2026-03-20T18:00:00+08:00',
    createdAt: '2026-03-12T10:20:00+08:00',
    status: 'hot',
    height: 'h-80'
  },
  {
    id: 2,
    title: '电商产品渲染：马年限定款运动鞋',
    enterprise: '步步高升品牌方',
    bounty: 1200,
    type: 'ComfyUI',
    image: 'https://picsum.photos/seed/shoes/400/400',
    tags: ['电商营销', '急单'],
    reqScore: 60,
    deadlineAt: '2026-03-18T12:00:00+08:00',
    createdAt: '2026-03-11T16:10:00+08:00',
    status: 'normal',
    height: 'h-56'
  },
  {
    id: 3,
    title: '短剧《霸总的AI小娇妻》前三集特效制作',
    enterprise: '星芒影视',
    bounty: 5000,
    type: '短视频',
    image: 'https://picsum.photos/seed/drama/400/700',
    tags: ['视频特效', '周期长'],
    reqScore: 90,
    deadlineAt: '2026-03-25T23:59:00+08:00',
    createdAt: '2026-03-10T09:30:00+08:00',
    status: 'hot',
    height: 'h-96'
  },
  {
    id: 4,
    title: '企业内部 IT 助手智能体搭建',
    enterprise: '云端科技',
    bounty: 3000,
    type: '智能体',
    image: 'https://picsum.photos/seed/tech/400/500',
    tags: ['Prompt调优', '逻辑编排'],
    reqScore: 85,
    deadlineAt: '2026-03-21T20:00:00+08:00',
    createdAt: '2026-03-12T08:40:00+08:00',
    status: 'normal',
    height: 'h-64'
  },
  {
    id: 5,
    title: '国风水墨画风格 LoRA 模型训练',
    enterprise: '古韵文化',
    bounty: 4500,
    type: '模型训练',
    image: 'https://picsum.photos/seed/ink/400/450',
    tags: ['数据集处理', '炼丹'],
    reqScore: 85,
    deadlineAt: '2026-03-29T10:00:00+08:00',
    createdAt: '2026-03-09T14:25:00+08:00',
    status: 'normal',
    height: 'h-72'
  },
  {
    id: 6,
    title: '马年大吉：新年贺卡批量定制',
    enterprise: '福马迎新',
    bounty: 800,
    type: '平面设计',
    image: 'https://picsum.photos/seed/card/400/600',
    tags: ['排版', '简单'],
    reqScore: 0,
    deadlineAt: '2026-03-17T23:59:00+08:00',
    createdAt: '2026-03-13T07:15:00+08:00',
    status: 'normal',
    height: 'h-80'
  },
  {
    id: 7,
    title: '赛博朋克风格游戏角色原画生成',
    enterprise: '霓虹游戏网络',
    bounty: 3200,
    type: 'ComfyUI',
    image: 'https://picsum.photos/seed/cyber/400/500',
    tags: ['角色设计', '精细控制'],
    reqScore: 75,
    deadlineAt: '2026-03-23T19:30:00+08:00',
    createdAt: '2026-03-11T11:45:00+08:00',
    status: 'hot',
    height: 'h-64'
  },
  {
    id: 8,
    title: '美妆产品使用教程短视频混剪',
    enterprise: '丽人美妆',
    bounty: 1500,
    type: '短视频',
    image: 'https://picsum.photos/seed/makeup/400/400',
    tags: ['混剪', '配音'],
    reqScore: 65,
    deadlineAt: '2026-03-19T21:00:00+08:00',
    createdAt: '2026-03-12T13:50:00+08:00',
    status: 'normal',
    height: 'h-56'
  }
];

// --- Mock Data: My Tasks ---
const MY_TASKS = [
  {
    id: 101,
    title: '2026 新春国潮风格海报批量生成',
    enterprise: '视觉灵动传媒',
    bounty: 2500,
    type: 'ComfyUI',
    image: 'https://picsum.photos/seed/newyear/400/600',
    status: 'in_progress', // in_progress, reviewing, completed, failed
    deadline: '2026-03-15 18:00',
    progress: 45,
    timeRemaining: '3天 8小时'
  },
  {
    id: 102,
    title: '电商产品渲染：马年限定款运动鞋',
    enterprise: '步步高升品牌方',
    bounty: 1200,
    type: 'ComfyUI',
    image: 'https://picsum.photos/seed/shoes/400/400',
    status: 'reviewing',
    deadline: '2026-03-10 12:00',
    progress: 100,
    timeRemaining: '审核中'
  },
  {
    id: 103,
    title: '美妆产品使用教程短视频混剪',
    enterprise: '丽人美妆',
    bounty: 1500,
    type: '短视频',
    image: 'https://picsum.photos/seed/makeup/400/400',
    status: 'completed',
    deadline: '2026-03-01 23:59',
    progress: 100,
    timeRemaining: '已结算'
  }
];

// --- Mock Data: My Portfolio ---
const MY_PORTFOLIO = [
  {
    id: 201,
    title: '赛博朋克风机甲设定',
    taskName: '赛博朋克风格游戏角色原画生成',
    image: 'https://picsum.photos/seed/mech/600/800',
    likes: 128,
    views: 1024,
    isPublic: true,
    date: '2026-02-15',
    type: 'image'
  },
  {
    id: 202,
    title: '马年新春贺卡-福字篇',
    taskName: '马年大吉：新年贺卡批量定制',
    image: 'https://picsum.photos/seed/fu/600/600',
    likes: 56,
    views: 320,
    isPublic: true,
    date: '2026-01-20',
    type: 'image'
  },
  {
    id: 203,
    title: '美妆高燃混剪',
    taskName: '美妆产品使用教程短视频混剪',
    image: 'https://picsum.photos/seed/makeup2/800/450',
    likes: 89,
    views: 500,
    isPublic: false,
    date: '2026-03-01',
    type: 'video'
  },
  {
    id: 204,
    title: '国风水墨测试集',
    taskName: '国风水墨画风格 LoRA 模型训练',
    image: 'https://picsum.photos/seed/ink2/600/800',
    likes: 230,
    views: 2100,
    isPublic: true,
    date: '2026-02-28',
    type: 'image'
  },
  {
    id: 205,
    title: '电商球鞋渲染图',
    taskName: '电商产品渲染：马年限定款运动鞋',
    image: 'https://picsum.photos/seed/shoes2/600/700',
    likes: 45,
    views: 180,
    isPublic: true,
    date: '2026-03-05',
    type: 'image'
  }
];

// --- Mock Data: Wallet Transactions ---
const WALLET_TRANSACTIONS = [
  { id: 301, title: '任务结算：赛博朋克风格游戏角色原画生成', type: 'income', amount: 3200, date: '2026-03-10 14:30', status: 'completed' },
  { id: 302, title: '积分提现至支付宝 (*1234)', type: 'outcome', amount: -5000, date: '2026-03-08 09:15', status: 'completed' },
  { id: 303, title: '任务结算：马年大吉：新年贺卡批量定制', type: 'income', amount: 800, date: '2026-03-05 16:45', status: 'completed' },
  { id: 304, title: '任务结算：美妆产品使用教程短视频混剪', type: 'income', amount: 1500, date: '2026-03-01 11:20', status: 'completed' },
  { id: 305, title: '官方激励：图片模板创作狂欢季参与奖', type: 'income', amount: 500, date: '2026-02-28 10:00', status: 'completed' },
];

// --- Mock Data: Wallet Charts ---
const REVENUE_TREND_DATA = [
  { name: '10月', income: 4200, outcome: 1500 },
  { name: '11月', income: 5800, outcome: 2000 },
  { name: '12月', income: 3500, outcome: 1200 },
  { name: '1月', income: 8900, outcome: 5000 },
  { name: '2月', income: 6400, outcome: 3000 },
  { name: '3月', income: 7500, outcome: 2500 },
];

const INCOME_SOURCE_DATA = [
  { name: '图像生成', value: 12500 },
  { name: '视频剪辑', value: 8400 },
  { name: '模型训练', value: 5600 },
  { name: '官方奖励', value: 2000 },
  { name: '其他', value: 1500 },
];

// --- Mock Data: Ability Profile ---
const ABILITY_RADAR_DATA = [
  { subject: '图像生成', score: 92, fullMark: 100 },
  { subject: '视频剪辑', score: 85, fullMark: 100 },
  { subject: '提示词工程', score: 95, fullMark: 100 },
  { subject: '模型微调', score: 78, fullMark: 100 },
  { subject: '交付质量', score: 88, fullMark: 100 },
  { subject: '沟通响应', score: 90, fullMark: 100 },
];

const ACHIEVEMENTS = [
  { id: 1, title: '视觉大师', desc: '图像生成类任务获得 50 次优秀评价', icon: <ImageIcon size={24} className="text-blue-500" />, color: 'bg-blue-100 border-blue-200' },
  { id: 2, title: '守时标兵', desc: '连续 30 个任务提前或按时交付', icon: <Clock size={24} className="text-sky-500" />, color: 'bg-sky-100 border-sky-200' },
  { id: 3, title: '提示词专家', desc: '提示词工程能力分突破 90 分', icon: <Sparkles size={24} className="text-cyan-500" />, color: 'bg-cyan-100 border-cyan-200' },
];

export type DashboardView = 'hall' | 'my-tasks' | 'portfolio' | 'wallet' | 'ability' | 'publish';

interface DashboardShellProps {
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

const ACCESS_TOKEN_KEY = 'yzcube_access_token';
const REFRESH_TOKEN_KEY = 'yzcube_refresh_token';
const AUTH_USERNAME_KEY = 'yzcube_auth_username';

export default function DashboardShell({ currentView, onNavigate }: DashboardShellProps) {
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingView, setPendingView] = useState<DashboardView | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState(() => ({
    username: localStorage.getItem(AUTH_USERNAME_KEY) || '',
    password: '',
  }));
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    companyName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [hallSearch, setHallSearch] = useState('');
  const [hallSort, setHallSort] = useState<'latest' | 'bounty_desc' | 'deadline_asc'>('latest');
  const [hallMinBounty, setHallMinBounty] = useState('');
  const [hallMaxBounty, setHallMaxBounty] = useState('');
  const [hallMinScore, setHallMinScore] = useState('');
  const [hallDeadlineWindow, setHallDeadlineWindow] = useState<'all' | '3' | '7' | '30'>('all');
  const [hallTasks, setHallTasks] = useState<TaskListItem[]>([]);
  const [hallTotal, setHallTotal] = useState(0);
  const [hallLoading, setHallLoading] = useState(false);
  const [hallError, setHallError] = useState('');
  const [myTasksTab, setMyTasksTab] = useState('all'); // 'all' | 'in_progress' | 'reviewing' | 'completed'
  const [portfolioTab, setPortfolioTab] = useState('all'); // 'all' | 'public' | 'private'
  const [walletTab, setWalletTab] = useState('all'); // 'all' | 'income' | 'outcome'
  const [publishAbilityScore, setPublishAbilityScore] = useState(60);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const visibleView = !isAuthenticated && currentView !== 'hall' ? 'hall' : currentView;

  const openLoginModal = (nextView?: DashboardView) => {
    if (nextView) {
      setPendingView(nextView);
    }
    setAuthMode('login');
    setLoginError('');
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setAuthMode('login');
    setLoginError('');
    setPendingView(null);
  };

  const handleMenuPlaceholder = (label: string) => {
    setShowUserMenu(false);
    window.alert(`${label} 功能正在准备中`);
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    setAccessToken(null);
    setIsAuthenticated(false);
    setShowUserMenu(false);
    setPendingView(null);
    setLoginForm({ username: '', password: '' });
    onNavigate('hall');
  };

  const requireLogin = (action?: () => void) => {
    if (isAuthenticated) {
      action?.();
      return;
    }
    openLoginModal();
  };

  const handleProtectedNavigate = (view: DashboardView) => {
    if (view === 'hall') {
      onNavigate(view);
      return;
    }
    if (!isAuthenticated) {
      openLoginModal(view);
      return;
    }
    onNavigate(view);
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError('请输入账号和密码。');
      return;
    }
    try {
      setIsLoggingIn(true);
      setLoginError('');
      const tokens = await login(loginForm.username.trim(), loginForm.password);
      const me = await getMe(tokens.accessToken);

      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(AUTH_USERNAME_KEY, me.username);

      setAccessToken(tokens.accessToken);
      setLoginForm((prev) => ({ ...prev, username: me.username, password: '' }));
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setAuthMode('login');
      setPendingView((prev) => {
        if (prev) {
          onNavigate(prev);
        }
        return null;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败，请稍后重试。';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !registerForm.companyName.trim() ||
      !registerForm.username.trim() ||
      !registerForm.password.trim() ||
      !registerForm.confirmPassword.trim()
    ) {
      setLoginError('请完整填写企业注册信息。');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setLoginError('两次输入的密码不一致。');
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginError('');
      await registerEnterprise(registerForm.username.trim(), registerForm.password);
      setAuthMode('login');
      setShowPassword(false);
      setLoginForm({
        username: registerForm.username.trim(),
        password: '',
      });
      setRegisterForm({
        companyName: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败，请稍后重试。';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setIsAuthenticated(false);
      setAuthInitialized(true);
      return;
    }

    let cancelled = false;
    const restore = async () => {
      try {
        const me = await getMe(accessToken);
        if (cancelled) {
          return;
        }
        setIsAuthenticated(true);
        setLoginForm((prev) => ({ ...prev, username: me.username, password: '' }));
        localStorage.setItem(AUTH_USERNAME_KEY, me.username);
      } catch {
        if (cancelled) {
          return;
        }
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USERNAME_KEY);
        setAccessToken(null);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) {
          setAuthInitialized(true);
        }
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (showLoginModal) {
        closeLoginModal();
      }
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showLoginModal, showUserMenu]);

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

  useEffect(() => {
    if (!authInitialized) {
      return;
    }
    if (!isAuthenticated && currentView !== 'hall') {
      openLoginModal();
    }
  }, [authInitialized, currentView, isAuthenticated]);

  useEffect(() => {
    if (visibleView !== 'hall') {
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        setHallLoading(true);
        setHallError('');
        const categoryMap: Record<string, string | undefined> = {
          all: undefined,
          comfyui: 'comfyui',
          video: 'video',
          agent: 'agent',
          design: 'design',
        };
        const result = await fetchTasks({
          q: hallSearch || undefined,
          category: categoryMap[activeTab],
          bounty_min: hallMinBounty.trim() ? Number(hallMinBounty) : undefined,
          bounty_max: hallMaxBounty.trim() ? Number(hallMaxBounty) : undefined,
          min_score: hallMinScore.trim() ? Number(hallMinScore) : undefined,
          deadline_days: hallDeadlineWindow === 'all' ? undefined : Number(hallDeadlineWindow),
          sort: hallSort,
          page: 1,
          page_size: 50,
        });
        if (cancelled) {
          return;
        }
        setHallTasks(result.items);
        setHallTotal(result.total);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setHallError(err instanceof Error ? err.message : '任务加载失败');
      } finally {
        if (!cancelled) {
          setHallLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, hallDeadlineWindow, hallMaxBounty, hallMinBounty, hallMinScore, hallSearch, hallSort, visibleView]);

  // --- Render Task Hall Content ---
  const renderTaskHall = () => {
    const now = Date.now();
    const categoryLabelMap: Record<string, string> = {
      comfyui: 'ComfyUI',
      video: '短视频',
      agent: '智能体',
      design: '平面设计',
    };

    const formatDeadline = (iso: string) => {
      const target = new Date(iso).getTime();
      const diff = target - now;
      if (diff <= 0) {
        return '已截止';
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      if (days > 0) {
        return `${days}天${hours}小时后截止`;
      }
      return `${hours}小时后截止`;
    };
    const previewHeightPool = ['h-52', 'h-60', 'h-64', 'h-72', 'h-80'];

    return (
      <div className="max-w-[1600px] mx-auto space-y-8">
      {/* Hero Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden h-64 group cursor-pointer shadow-sm">
          <img src="https://picsum.photos/seed/banner1/1200/400" alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/50 to-transparent flex flex-col justify-center p-8">
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded w-fit mb-3 shadow-sm">官方激励计划</span>
            <h2 className="text-3xl font-bold text-white mb-2">图片模板创作狂欢季</h2>
            <p className="text-blue-50 mb-6 max-w-md opacity-90">参与四大主题创作，赢取丰厚积分与企业直签机会。完成前置课程即可抢单！</p>
            <button
              onClick={() => requireLogin()}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-full font-bold text-sm w-fit hover:bg-blue-50 transition-colors shadow-sm"
            >
              立即查看详情
            </button>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer hidden lg:block shadow-sm">
          <img src="https://picsum.photos/seed/banner2/600/400" alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex flex-col justify-end p-6">
            <h3 className="text-xl font-bold text-white mb-1">企业信誉分规则更新</h3>
            <p className="text-slate-300 text-sm">保障接单权益，低于60分企业已暂停发单</p>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">热门任务赛道</h3>
          <button className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
            查看全部 <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all border ${
                activeTab === cat.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200/50' 
                  : 'bg-white text-slate-600 border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm'
              }`}
            >
              {cat.icon}
              <span className="font-medium">{cat.name}</span>
              {cat.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ml-1 ${
                  activeTab === cat.id ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  {cat.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task Board Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <input
            type="text"
            value={hallSearch}
            onChange={(e) => setHallSearch(e.target.value)}
            placeholder="搜索任务标题/企业/标签"
            className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="number"
            value={hallMinBounty}
            onChange={(e) => setHallMinBounty(e.target.value)}
            placeholder="最低赏金"
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="number"
            value={hallMaxBounty}
            onChange={(e) => setHallMaxBounty(e.target.value)}
            placeholder="最高赏金"
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={hallMinScore}
            onChange={(e) => setHallMinScore(e.target.value)}
            placeholder="最低能力分"
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="button"
            onClick={() => {
              setHallSearch('');
              setHallMinBounty('');
              setHallMaxBounty('');
              setHallMinScore('');
              setHallDeadlineWindow('all');
              setHallSort('latest');
            }}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            重置筛选
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Filter size={13} /> 截止时间
          </div>
          {[
            { value: 'all', label: '不限' },
            { value: '3', label: '3天内' },
            { value: '7', label: '7天内' },
            { value: '30', label: '30天内' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setHallDeadlineWindow(item.value as 'all' | '3' | '7' | '30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                hallDeadlineWindow === item.value
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <select
            value={hallSort}
            onChange={(e) => setHallSort(e.target.value as 'latest' | 'bounty_desc' | 'deadline_asc')}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
          >
            <option value="latest">最新发布</option>
            <option value="bounty_desc">赏金最高</option>
            <option value="deadline_asc">即将截止</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">共 {hallTotal} 个结果</span>
        </div>
      </div>

      {/* Masonry Task Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-5 2xl:columns-5 gap-6 space-y-6 pb-10">
        {hallError && (
          <div className="break-inside-avoid bg-white border border-rose-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-rose-600 font-semibold mb-1">任务加载失败</h4>
            <p className="text-sm text-slate-600 mb-4">{hallError}</p>
            <button
              type="button"
              onClick={() => setHallSort((prev) => (prev === 'latest' ? 'bounty_desc' : 'latest'))}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              触发重试
            </button>
          </div>
        )}

        {hallLoading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="break-inside-avoid bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="h-52 bg-slate-100 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 rounded bg-slate-100 animate-pulse"></div>
                <div className="h-3 rounded bg-slate-100 animate-pulse w-3/4"></div>
                <div className="h-8 rounded bg-slate-100 animate-pulse"></div>
              </div>
            </div>
          ))}

        {!hallLoading && !hallError && hallTasks.map((task) => {
          const tags = Array.isArray(task.tags_json) ? task.tags_json.filter((tag): tag is string => typeof tag === 'string') : [];
          const typeLabel = categoryLabelMap[task.category] ?? task.category;
          const previewHeightClass = previewHeightPool[task.id % previewHeightPool.length];
          return (
          <div key={task.id} className="break-inside-avoid bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col">
            
            {/* Image/Preview Area */}
            <div className={`relative w-full ${previewHeightClass} overflow-hidden bg-slate-100`}>
              <img src={`https://picsum.photos/seed/task-${task.id}/640/480`} alt={task.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              
              {/* Top Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <span className="bg-black/50 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 w-fit border border-white/10">
                  {task.category === 'comfyui' ? <Sparkles size={12} className="text-blue-300" /> : <MonitorSmartphone size={12} />}
                  {typeLabel}
                </span>
                {(tags.includes('急单') || task.status === 'urgent') && (
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 w-fit shadow-sm border border-red-400/50">
                    <Flame size={12} /> 急单
                  </span>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                <button
                  onClick={() => requireLogin()}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-500"
                >
                  查看详情
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1">
              <h4 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h4>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map((tag, i) => (
                  <span key={i} className="text-[10px] bg-slate-50 text-slate-500 border border-slate-100 px-2 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <User size={12} /> {task.enterprise_name}
                  </div>
                  <div className="text-[10px] text-amber-600 mb-1.5">{formatDeadline(task.deadline_at)}</div>
                  <div className="text-lg font-black text-blue-600 flex items-center gap-1">
                    <span className="text-sm">💰</span> {task.bounty_points} <span className="text-xs font-normal text-slate-400">积分</span>
                  </div>
                </div>
                
                {/* Requirement & Action */}
                <div className="flex flex-col items-end gap-2">
                  {task.required_score > 0 ? (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                      <Award size={10} className="text-blue-500" /> 能力分 ≥ {task.required_score}
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                      无门槛
                    </div>
                  )}
                  <button
                    onClick={() => requireLogin()}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200 transition-all"
                  >
                    抢单
                  </button>
                </div>
              </div>
            </div>

          </div>
        );})}

        {!hallLoading && !hallError && hallTasks.length === 0 && (
          <div className="break-inside-avoid bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText size={18} />
            </div>
            <h4 className="text-slate-800 font-semibold mb-1">没有符合条件的任务</h4>
            <p className="text-sm text-slate-500 mb-4">你可以放宽筛选条件，或切换任务赛道再试试。</p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setHallSearch('');
                setHallMinBounty('');
                setHallMaxBounty('');
                setHallMinScore('');
                setHallDeadlineWindow('all');
                setHallSort('latest');
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              清空筛选
            </button>
          </div>
        )}
      </div>
    </div>
    );
  };

  // --- Render My Tasks Content ---
  const renderMyTasks = () => {
    const filteredTasks = myTasksTab === 'all' 
      ? MY_TASKS 
      : MY_TASKS.filter(t => t.status === myTasksTab);

    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">我的任务</h2>
            <p className="text-slate-500 text-sm">管理您已接取的任务，按时交付以提升能力分。</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col items-center">
              <span className="text-xs text-slate-500 mb-1">进行中</span>
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col items-center">
              <span className="text-xs text-slate-500 mb-1">累计收益</span>
              <span className="text-xl font-bold text-amber-500">1500</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200">
          {[
            { id: 'all', label: '全部' },
            { id: 'in_progress', label: '进行中' },
            { id: 'reviewing', label: '待审核' },
            { id: 'completed', label: '已完成' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMyTasksTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                myTasksTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {myTasksTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-4 pb-10">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col md:flex-row gap-6">
              
              {/* Thumbnail */}
              <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-100">
                <img src={task.image} alt={task.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                  <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-white/10">
                    {task.type === 'ComfyUI' ? <Sparkles size={10} className="text-blue-300" /> : <MonitorSmartphone size={10} />}
                    {task.type}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors line-clamp-1">
                      {task.title}
                    </h3>
                    <div className="text-lg font-black text-blue-600 whitespace-nowrap ml-4">
                      <span className="text-sm">💰</span> {task.bounty} <span className="text-xs font-normal text-slate-400">积分</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-4 mb-4">
                    <span className="flex items-center gap-1"><User size={14} /> {task.enterprise}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> 截止: {task.deadline}</span>
                  </div>
                </div>

                {/* Status & Progress */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    {task.status === 'in_progress' && (
                      <>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1 border border-blue-100">
                          <Play size={12} /> 进行中
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">剩 {task.timeRemaining}</span>
                      </>
                    )}
                    {task.status === 'reviewing' && (
                      <>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1 border border-amber-100">
                          <AlertCircle size={12} /> 待审核
                        </span>
                        <span className="text-xs text-slate-400">企业正在验收您的交付物</span>
                      </>
                    )}
                    {task.status === 'completed' && (
                      <>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-100">
                          <CheckCircle2 size={12} /> 已完成
                        </span>
                        <span className="text-xs text-slate-400">积分已发放至钱包</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {task.status === 'in_progress' && task.type === 'ComfyUI' && (
                      <button className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                        <Sparkles size={16} /> 启动实训环境
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        提交交付
                      </button>
                    )}
                    {task.status === 'reviewing' && (
                      <button className="bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        查看交付物
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button className="bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        查看评价
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FileText size={24} className="text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-medium mb-1">暂无任务</h3>
              <p className="text-slate-500 text-sm">当前分类下没有找到相关任务</p>
              <button 
                onClick={() => onNavigate('hall')}
                className="mt-6 text-blue-600 text-sm font-medium hover:underline"
              >
                去任务大厅看看
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Render My Portfolio Content ---
  const renderMyPortfolio = () => {
    const filteredPortfolio = portfolioTab === 'all' 
      ? MY_PORTFOLIO 
      : MY_PORTFOLIO.filter(item => portfolioTab === 'public' ? item.isPublic : !item.isPublic);

    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">我的作品集</h2>
            <p className="text-slate-500 text-sm">展示您的优秀交付物，吸引更多企业直签邀请。</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col items-center">
              <span className="text-xs text-slate-500 mb-1">获赞总数</span>
              <span className="text-xl font-bold text-rose-500 flex items-center gap-1"><Heart size={16} className="fill-rose-500" /> 548</span>
            </div>
            <button
              onClick={() => requireLogin()}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 h-full"
            >
              <Plus size={18} /> 上传新作品
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200">
          {[
            { id: 'all', label: '全部作品' },
            { id: 'public', label: '已公开' },
            { id: 'private', label: '私密' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPortfolioTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                portfolioTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {portfolioTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Portfolio Grid (Masonry) */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-10 mt-6">
          {filteredPortfolio.map(item => (
            <div key={item.id} className="break-inside-avoid bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col">
              
              {/* Image Area */}
              <div className="relative w-full bg-slate-100 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
                
                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                    {item.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 border border-white/10 ${item.isPublic ? 'bg-emerald-500/80' : 'bg-slate-800/80'}`}>
                    {item.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                    {item.isPublic ? '公开' : '私密'}
                  </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="flex gap-3">
                    <button
                      onClick={() => requireLogin()}
                      className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => requireLogin()}
                      className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex flex-col flex-1">
                <h4 className="font-bold text-slate-900 text-base leading-snug mb-1 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mb-4 line-clamp-1 flex items-center gap-1">
                  <Briefcase size={12} /> {item.taskName}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
                  <span>{item.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 hover:text-blue-600 transition-colors"><Eye size={14} /> {item.views}</span>
                    <span className="flex items-center gap-1 hover:text-rose-500 transition-colors"><Heart size={14} className={item.likes > 100 ? "fill-rose-400 text-rose-400" : ""} /> {item.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredPortfolio.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ImageIcon size={24} className="text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">暂无作品</h3>
            <p className="text-slate-500 text-sm">当前分类下没有找到相关作品</p>
          </div>
        )}
      </div>
    );
  };

  // --- Render Wallet Content ---
  const renderWallet = () => {
    const filteredTransactions = walletTab === 'all' 
      ? WALLET_TRANSACTIONS 
      : WALLET_TRANSACTIONS.filter(t => t.type === walletTab);

    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">积分钱包</h2>
          <p className="text-slate-500 text-sm">管理您的任务收益，支持提现至绑定的企业或个人账户。</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-blue-50/90 to-white/50 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(37,99,235,0.08)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-6">
                <span className="text-blue-700 font-bold flex items-center gap-2"><Wallet size={18} /> 可用积分余额</span>
                <span className="bg-blue-100/60 text-blue-700 text-xs px-2 py-1 rounded backdrop-blur-md border border-blue-200/60 font-medium">正常状态</span>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-5xl font-black tracking-tight text-slate-800">12,500<span className="text-2xl font-medium text-slate-400 ml-1">.00</span></div>
                <button
                  onClick={() => requireLogin()}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  <CreditCard size={18} /> 申请提现
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-center">
            <div className="text-slate-500 text-sm mb-2 flex items-center gap-2"><Clock size={16} /> 待结算积分</div>
            <div className="text-3xl font-bold text-slate-800 mb-4">3,200</div>
            <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
              包含 2 个待企业验收的任务
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Trend Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" /> 近期收益趋势
            </h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REVENUE_TREND_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="income" name="收入 (积分)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="outcome" name="支出/提现 (积分)" stroke="#cbd5e1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-blue-600" /> 收益来源分布
            </h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INCOME_SOURCE_DATA} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} width={70} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name="累计收益 (积分)" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24}>
                    {
                      INCOME_SOURCE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : index === 1 ? '#3b82f6' : index === 2 ? '#60a5fa' : '#93c5fd'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Receipt size={20} className="text-blue-600" /> 资金流水
            </h3>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/60">
              {[
                { id: 'all', label: '全部' },
                { id: 'income', label: '收入' },
                { id: 'outcome', label: '支出/提现' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWalletTab(tab.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    walletTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-medium mb-1">{tx.title}</h4>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>{tx.date}</span>
                      {tx.status === 'completed' ? (
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> 已完成</span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1"><Clock size={12} /> 处理中</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-bold whitespace-nowrap ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                }`}>
                  {tx.type === 'income' ? '+' : ''}{tx.amount}
                </div>
              </div>
            ))}
            
            {filteredTransactions.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-sm">
                暂无相关流水记录
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Render Ability Profile Content ---
  const renderAbilityProfile = () => {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">能力分档案</h2>
          <p className="text-slate-500 text-sm">多维度展示您的专业能力，高分可解锁更多优质高薪任务，提升接单成功率。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Card */}
          <div className="lg:col-span-1 relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-blue-50/90 to-white/50 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(37,99,235,0.08)] flex flex-col justify-center items-center text-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <Trophy size={36} className="text-white" />
              </div>
              <h3 className="text-slate-500 font-medium mb-1">综合能力得分</h3>
              <div className="text-6xl font-black text-slate-800 tracking-tight mb-2">88<span className="text-2xl text-slate-400 font-medium">/100</span></div>
              <div className="inline-flex items-center gap-1.5 bg-blue-100/80 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200/60 mt-2">
                <Medal size={16} /> 铂金创作者
              </div>
              <p className="text-xs text-slate-400 mt-5 bg-white/60 py-1.5 px-3 rounded-lg inline-block">击败了 85% 的平台创作者</p>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Target size={20} className="text-blue-600" /> 能力雷达图
            </h3>
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={ABILITY_RADAR_DATA}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                  <Radar name="能力评分" dataKey="score" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Achievements & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Achievements */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" /> 获得徽章
            </h3>
            <div className="space-y-4">
              {ACHIEVEMENTS.map(ach => (
                <div key={ach.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${ach.color}`}>
                    {ach.icon}
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-bold text-sm mb-1">{ach.title}</h4>
                    <p className="text-slate-500 text-xs">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Progress */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Hexagon size={20} className="text-blue-600" /> 详细评分
            </h3>
            <div className="space-y-5">
              {ABILITY_RADAR_DATA.map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{skill.subject}</span>
                    <span className="text-slate-800 font-bold">{skill.score} <span className="text-slate-400 text-xs font-normal">/ 100</span></span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPublishTask = () => {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">发布新任务</h2>
          <p className="text-slate-500 text-sm">填写任务需求，吸引平台优质创作者为您提供交付物。</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 max-w-4xl">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">基本信息</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">任务标题 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="例如：2026 新春国潮风格海报批量生成"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">任务类型 <span className="text-rose-500">*</span></label>
                  <select className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all appearance-none">
                    <option value="">请选择任务类型</option>
                    <option value="comfyui">ComfyUI 工作流</option>
                    <option value="video">短视频剪辑</option>
                    <option value="agent">客服智能体</option>
                    <option value="design">平面视觉设计</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">任务赏金 (积分) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">💰</span>
                    <input
                      type="number"
                      placeholder="输入积分数量"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">截止日期 <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">需求详情</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">任务描述 <span className="text-rose-500">*</span></label>
                <textarea
                  rows={5}
                  placeholder="详细描述您的任务需求、交付标准、风格偏好等..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">参考附件</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-slate-400">支持 JPG, PNG, PDF, ZIP 格式，单个文件不超过 50MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">接单门槛</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">最低能力分要求</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={publishAbilityScore}
                      onChange={(e) => setPublishAbilityScore(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-bold text-blue-600 w-14 text-right">{publishAbilityScore} 分</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">设置门槛可筛选更优质的创作者，但可能影响接单速度。</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
              <button type="button" className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm">
                保存草稿
              </button>
              <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all">
                确认发布
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F4F7FB] text-slate-800 font-sans overflow-hidden">
      
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-blue-100/50 flex flex-col flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="relative h-10 w-10 flex items-center justify-center">
              <span className="logo-breathing-halo absolute inset-0 rounded-full" aria-hidden="true" />
              <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-blue-300 bg-white shadow-sm z-10">
                {!logoLoadError ? (
                  <img
                    src={new URL('../../assets/home/logo.png', import.meta.url).href}
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
          {/* Menu Group 1 */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">接单大厅</div>
            <nav className="space-y-1">
              <button 
                onClick={() => handleProtectedNavigate('hall')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  visibleView === 'hall' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Home size={18} />
                <span>任务广场</span>
              </button>
              <button 
                onClick={() => handleProtectedNavigate('my-tasks')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  visibleView === 'my-tasks' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Briefcase size={18} />
                <span>我的任务</span>
              </button>
              <button 
                onClick={() => handleProtectedNavigate('portfolio')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  visibleView === 'portfolio' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <FolderOpen size={18} />
                <span>我的作品集</span>
              </button>
            </nav>
          </div>

          {/* Menu Group 2 */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">资产与资质</div>
            <nav className="space-y-1">
              <button 
                onClick={() => handleProtectedNavigate('wallet')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  visibleView === 'wallet' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Wallet size={18} />
                <span>积分钱包</span>
              </button>
              <button 
                onClick={() => handleProtectedNavigate('ability')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  visibleView === 'ability' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Award size={18} />
                <span>能力分档案</span>
              </button>
            </nav>
          </div>

          {/* Menu Group 3 - Enterprise */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">企业服务</div>
            <nav className="space-y-1">
              <button
                onClick={() => handleProtectedNavigate('publish')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  visibleView === 'publish' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <PlusSquare size={18} />
                <span>发布新任务</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-slate-400">
          <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><Moon size={18} /></button>
          <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><MonitorSmartphone size={18} /></button>
          <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><List size={18} /></button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-10">
          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="搜索任务/企业/工作流/智能体..." 
                className="w-full bg-slate-100/80 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 rounded-full py-2 pl-10 pr-4 text-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5 ml-6">
            <button className="text-slate-500 hover:text-blue-600 relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-6 w-px bg-slate-200"></div>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl px-2 py-1.5 cursor-pointer hover:bg-blue-50/70 transition-colors"
                >
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-slate-800">{loginForm.username || '张同学'}</div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
                    {(loginForm.username?.[0] || '张').toUpperCase()}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-64 rounded-2xl border border-white/70 bg-white/98 backdrop-blur-xl shadow-[0_22px_48px_rgba(15,23,42,0.18)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/70 bg-gradient-to-r from-white/35 to-blue-50/55">
                      <div className="text-sm font-bold text-slate-800">{loginForm.username || '张同学'}</div>
                      <div className="mt-1 text-[11px] text-blue-700/90">已通过 SSO 认证</div>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => handleMenuPlaceholder('个人资料')}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-white/65 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <User size={15} />
                          个人资料
                        </span>
                        <span className="text-[11px] text-slate-400">即将上线</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMenuPlaceholder('修改密码')}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-white/65 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Lock size={15} />
                          修改密码
                        </span>
                        <span className="text-[11px] text-slate-400">即将上线</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMenuPlaceholder('账户设置')}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-white/65 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Settings size={15} />
                          账户设置
                        </span>
                        <span className="text-[11px] text-slate-400">即将上线</span>
                      </button>
                    </div>
                    <div className="px-2 pb-2">
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
            ) : (
              <button
                onClick={() => openLoginModal()}
                className="h-10 px-5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_16px_rgba(37,99,235,0.28)] hover:brightness-105 transition-all flex items-center gap-2"
              >
                <User size={14} />
                <span className="text-sm font-semibold">登录</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {visibleView === 'hall' && renderTaskHall()}
          {visibleView === 'my-tasks' && renderMyTasks()}
          {visibleView === 'portfolio' && renderMyPortfolio()}
          {visibleView === 'wallet' && renderWallet()}
          {visibleView === 'ability' && renderAbilityProfile()}
          {visibleView === 'publish' && renderPublishTask()}
        </div>
      </main>

      <LoginModal
        open={showLoginModal}
        authMode={authMode}
        loginForm={loginForm}
        registerForm={registerForm}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        showPassword={showPassword}
        logoSrc={new URL('../../assets/home/logo.png', import.meta.url).href}
        onClose={closeLoginModal}
        onSetAuthMode={setAuthMode}
        onSetLoginForm={setLoginForm}
        onSetRegisterForm={setRegisterForm}
        onSetShowPassword={setShowPassword}
        onClearError={() => setLoginError('')}
        onLoginSubmit={handleLoginSubmit}
        onRegisterSubmit={handleRegisterSubmit}
      />
    </div>
  );
}
