import React, { useState, useEffect } from 'react';
import { signInUser, signUpUser, isSupabaseConfigured } from '../lib/supabase';
import { FormInput } from './common/FormInput';
import { classifyError } from '../utils/errorHandler';

interface LoginViewProps {
  onLogin: (email: string, name?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Lockout / Rate limit client side (Item 8)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password || (mode === 'signup' && !name)) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await signUpUser(email, password, name, inviteCode);
        if (error) {
          const appErr = classifyError(error);
          setErrorMsg(appErr.message);
          setIsLoading(false);
          return;
        }

        setSuccessMsg('Conta criada com sucesso! Você já pode acessar.');
        const userName = name || data.user?.user_metadata?.name || 'Casal';
        setTimeout(() => {
          onLogin(email, userName);
        }, 600);
      } else {
        const { data, error } = await signInUser(email, password);
        if (error) {
          const newFailed = failedAttempts + 1;
          setFailedAttempts(newFailed);
          if (newFailed >= 5) {
            setLockoutTimer(30); // 30s lockout
            setFailedAttempts(0);
            setErrorMsg('Muitas tentativas malsucedidas. Por favor, aguarde 30 segundos.');
          } else {
            const appErr = classifyError(error);
            setErrorMsg(appErr.message);
          }
          setIsLoading(false);
          return;
        }

        setFailedAttempts(0);
        const userName = data.user?.user_metadata?.name || 'Casal';
        setSuccessMsg('Login realizado com sucesso!');
        setTimeout(() => {
          onLogin(email, userName);
        }, 400);
      }
    } catch (err: any) {
      const appErr = classifyError(err);
      setErrorMsg(appErr.message);
      setIsLoading(false);
    }
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
            Gestão financeira compartilhada e transparente para o casal.
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1c1833] border border-purple-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-purple-200">
              {isSupabaseConfigured ? 'Supabase Auth Conectado' : 'Modo Autenticação Local'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {isSupabaseConfigured ? 'Cloud Sync' : 'Offline Mode'}
          </span>
        </div>

        {/* Auth Mode Toggle Tabs (Item 3) */}
        <div className="flex bg-[#120f24] p-1.5 rounded-2xl border border-purple-500/20">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-purple-300/60 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-purple-300/60 hover:text-white'
            }`}
          >
            Criar Conta
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
          {mode === 'signup' && (
            <FormInput
              label="Seu Nome / Nome do Casal *"
              icon="person"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alex & Sam"
              required
            />
          )}

          <FormInput
            label="E-mail *"
            icon="mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            required
          />

          <div className="space-y-1 relative">
            <FormInput
              label="Senha *"
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Alternar visualização da senha"
              className="absolute right-3 top-7 text-purple-300 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {mode === 'signup' && (
            <FormInput
              label="Código de Convite do Casal (Opcional)"
              icon="diversity_1"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Cole o código do seu parceiro"
              helperText="Deixe em branco para criar um novo grupo de casal."
            />
          )}

          {mode === 'login' && (
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
            disabled={isLoading || lockoutTimer > 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            ) : lockoutTimer > 0 ? (
              `Aguarde ${lockoutTimer}s`
            ) : mode === 'signup' ? (
              'Criar Conta do Casal'
            ) : (
              'Acessar Finanças do Casal'
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-purple-300/60 pt-2">
          <span className="material-symbols-outlined text-xs text-purple-400">verified_user</span>
          <span>Acesso seguro com autenticação criptografada</span>
        </div>
      </div>
    </div>
  );
};
