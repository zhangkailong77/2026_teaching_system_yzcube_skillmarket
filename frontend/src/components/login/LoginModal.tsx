import type { FormEvent } from 'react';
import { Briefcase, Eye, EyeOff, Lock, ShieldCheck, User, X } from 'lucide-react';

export type AuthMode = 'login' | 'register';

export interface LoginFormState {
  username: string;
  password: string;
}

export interface RegisterFormState {
  companyName: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface LoginModalProps {
  open: boolean;
  authMode: AuthMode;
  loginForm: LoginFormState;
  registerForm: RegisterFormState;
  loginError: string;
  isLoggingIn: boolean;
  showPassword: boolean;
  logoSrc: string;
  onClose: () => void;
  onSetAuthMode: (mode: AuthMode) => void;
  onSetLoginForm: (updater: (prev: LoginFormState) => LoginFormState) => void;
  onSetRegisterForm: (updater: (prev: RegisterFormState) => RegisterFormState) => void;
  onSetShowPassword: (updater: (prev: boolean) => boolean) => void;
  onClearError: () => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRegisterSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function LoginModal({
  open,
  authMode,
  loginForm,
  registerForm,
  loginError,
  isLoggingIn,
  showPassword,
  logoSrc,
  onClose,
  onSetAuthMode,
  onSetLoginForm,
  onSetRegisterForm,
  onSetShowPassword,
  onClearError,
  onLoginSubmit,
  onRegisterSubmit,
}: LoginModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[460px] rounded-[28px] border border-white/60 bg-[#f8fbff]/95 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="关闭登录弹窗"
        >
          <X size={16} />
        </button>

        <div className="px-8 pt-10 pb-8">
          <div className="mx-auto mb-5 h-20 w-20 rounded-full border-4 border-blue-100 bg-white shadow-[0_10px_25px_rgba(37,99,235,0.2)] p-1">
            <img src={logoSrc} alt="平台 Logo" className="h-full w-full rounded-full object-cover" />
          </div>

          <div className="text-center mb-7">
            <h3 className="text-[34px] leading-none font-black text-slate-800 tracking-tight">
              {authMode === 'login' ? '欢迎继续创作' : '企业账号注册'}
            </h3>
            <p className="text-sm text-slate-500 mt-3">
              {authMode === 'login'
                ? '登录后可接单、管理交付与查看企业资产。'
                : '当前仅支持企业注册，个人账号暂不开放。'}
            </p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={onLoginSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">账号</span>
                <div className="relative mt-2">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={loginForm.username}
                    onChange={(event) => onSetLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="请输入你的账号"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-[15px] text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">密码</span>
                <div className="relative mt-2">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(event) => onSetLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="请输入登录密码"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 pr-12 text-[15px] text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70"
                  />
                  <button
                    type="button"
                    onClick={() => onSetShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {loginError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-base font-bold shadow-[0_10px_20px_rgba(37,99,235,0.35)] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isLoggingIn ? '登录中...' : '登录进入平台'}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClearError();
                    onSetAuthMode('register');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  还没有企业账号？立即注册
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegisterSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">企业名称</span>
                <div className="relative mt-2">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={registerForm.companyName}
                    onChange={(event) => onSetRegisterForm((prev) => ({ ...prev, companyName: event.target.value }))}
                    placeholder="请输入企业名称"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-[15px] text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">企业账号</span>
                <div className="relative mt-2">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={registerForm.username}
                    onChange={(event) => onSetRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="请输入企业账号"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-[15px] text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">设置密码</span>
                <div className="relative mt-2">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => onSetRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="请输入密码"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-[15px] text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">确认密码</span>
                <div className="relative mt-2">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      onSetRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    placeholder="请再次输入密码"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-[15px] text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70"
                  />
                </div>
              </label>

              {loginError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white text-base font-bold shadow-[0_10px_20px_rgba(37,99,235,0.35)] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isLoggingIn ? '提交中...' : '完成企业注册'}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClearError();
                    onSetAuthMode('login');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  已有企业账号？返回登录
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} />
              连接安全加密
            </span>
            <span className="flex items-center gap-1">
              <Lock size={13} />
              账户隐私保护
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
