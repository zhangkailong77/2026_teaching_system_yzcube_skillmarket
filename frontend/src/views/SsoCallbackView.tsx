import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, LoaderCircle } from 'lucide-react';
import { exchangeFederationTicket } from '../services/auth';

const ACCESS_TOKEN_KEY = 'yzcube_access_token';
const REFRESH_TOKEN_KEY = 'yzcube_refresh_token';
const AUTH_USERNAME_KEY = 'yzcube_auth_username';

const ERROR_MAP: Record<string, string> = {
  'ticket expired': '票据已过期',
  'ticket already used': '票据已被使用',
  'invalid ticket signature': '票据签名无效',
  'invalid ticket type': '票据类型无效',
  'untrusted issuer': '票据来源不受信任',
};

export default function SsoCallbackView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(true);
  const exchangedRef = useRef(false);
  const ticket = useMemo(() => searchParams.get('ticket')?.trim() ?? '', [searchParams]);
  const returnUrl = useMemo(
    () =>
      searchParams.get('return_url')?.trim() ||
      (import.meta.env.VITE_TEACHING_SYSTEM_URL as string | undefined)?.trim() ||
      '',
    [searchParams],
  );

  useEffect(() => {
    if (exchangedRef.current) {
      return;
    }
    exchangedRef.current = true;

    const run = async () => {
      if (!ticket) {
        setError('缺少 ticket 参数');
        setProcessing(false);
        return;
      }
      try {
        const result = await exchangeFederationTicket(ticket);
        localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
        localStorage.setItem(AUTH_USERNAME_KEY, result.user.username);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        navigate('/my-tasks', { replace: true });
      } catch (err) {
        const raw = err instanceof Error ? err.message : '票据兑换失败';
        setError(ERROR_MAP[raw] ?? raw);
        setProcessing(false);
      }
    };
    run();
  }, [navigate, ticket]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        {processing ? (
          <div className="flex items-center gap-3 text-slate-700">
            <LoaderCircle className="animate-spin text-blue-600" size={20} />
            <div>
              <div className="font-semibold">正在验证联邦票据</div>
              <div className="text-sm text-slate-500 mt-1">请稍候，完成后将自动跳转任务页面</div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3">
              <AlertCircle className="text-rose-500 mt-0.5" size={20} />
              <div>
                <div className="font-semibold text-slate-800">登录失败</div>
                <div className="text-sm text-slate-600 mt-1">{error}</div>
              </div>
            </div>
            <div className="mt-6">
              {returnUrl ? (
                <a
                  href={returnUrl}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft size={15} />
                  返回教学系统
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/hall', { replace: true })}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft size={15} />
                  返回首页
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
