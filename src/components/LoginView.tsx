import React, { useState } from 'react';
import { signUpUser, signInUser, isSupabaseConfigured } from '../lib/supabase';

interface LoginViewProps {
  onLogin: (email: string, name?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (authMode === 'register') {
      if (password.length < 6) {
        setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem. Digite novamente.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'register') {
        const { data, error } = await signUpUser(email, password, name || 'Casal');
        if (error) {
          setErrorMsg(error.message || 'Erro ao criar conta no Supabase Auth.');
          setIsLoading(false);
          return;
        }

        if (data?.session) {
          setSuccessMsg('Conta criada e autenticada com sucesso!');
          setTimeout(() => {
            onLogin(email, name || data.user?.user_metadata?.name || 'Casal');
          }, 600);
        } else {
          setSuccessMsg('Cadastro realizado! Se o Supabase exigir confirmação por e-mail, verifique sua caixa de entrada.');
          setIsLoading(false);
        }
      } else {
        const { data, error } = await signInUser(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
          } else {
            setErrorMsg(error.message || 'Erro ao realizar login.');
          }
          setIsLoading(false);
          return;
        }

        const userName = data.user?.user_metadata?.name || name || 'Casal';
        setSuccessMsg('Login realizado com sucesso!');
        setTimeout(() => {
          onLogin(email, userName);
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro inesperado.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      setIsLoading(false);
      onLogin('casal@financasdocasal.app', 'Alex & Sam');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0f0c1b] font-['Inter',sans-serif] relative overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-8 rounded-3xl shadow-2xl relative z-10 space-y-6 border border-purple-500/20 bg-[#131024]/90 backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-900/40 mb-3">
            <span className="material-symbols-outlined text-3xl">favorite</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-200 via-purple-100 to-white bg-clip-text text-transparent tracking-tight">
            Finanças do Casal
          </h1>
          <p className="text-xs text-purple-200/70 font-medium">
            Gestão financeira inteligente, transparente e em sintonia para o casal.
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1c1833] border border-purple-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
            <span className="font-semibold text-purple-200">
              {isSupabaseConfigured ? 'Supabase Auth Conectado' : 'Modo Autenticação Local'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {isSupabaseConfigured ? 'Cloud Sync' : 'Offline Mode'}
          </span>
        </div>

        {/* Auth Mode Tabs (Login vs Register) */}
        <div className="flex rounded-2xl bg-[#1a1633] p-1 border border-purple-500/20">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-purple-200/60 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-purple-200/60 hover:text-white'
            }`}
          >
            Criar Conta do Casal
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-base text-rose-400 shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-base text-emerald-400 shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Nome do Casal (ou dos usuários)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-[18px]">
                  favorite
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Alex & Sam"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-purple-200/80 mb-1">
              E-mail do Casal
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200/80 mb-1">
              Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-[18px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-[18px]">
                  lock_reset
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
            </div>
          )}

          {authMode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-purple-200/80">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-purple-500/30 bg-[#120f24] text-purple-600 focus:ring-purple-500"
                />
                Lembrar da sessão
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            ) : authMode === 'login' ? (
              'Acessar Finanças do Casal'
            ) : (
              'Cadastrar Conta do Casal'
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-purple-300/60 pt-2">
          <span className="material-symbols-outlined text-xs text-purple-400">verified_user</span>
          <span>Sessão segura e protegida com Supabase Auth</span>
        </div>
      </div>
    </div>
  );
};
