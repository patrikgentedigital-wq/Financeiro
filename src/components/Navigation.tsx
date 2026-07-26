import React, { useState } from 'react';
import { ViewMode, UserProfile } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: UserProfile;
  onOpenNewTransaction: () => void;
  globalSearchQuery: string;
  onSearchChange: (query: string) => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  user,
  onOpenNewTransaction,
  globalSearchQuery,
  onSearchChange,
  onLogout,
  isDarkMode = true,
  onToggleDarkMode,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <>
      {/* Top Header Bar */}
      <header className="fixed top-0 right-0 left-0 z-40 flex justify-between items-center px-4 md:px-12 h-16 bg-[#131024]/90 backdrop-blur-xl border-b border-purple-500/20 shadow-lg">
        <div className="flex items-center gap-6 md:gap-8">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 font-extrabold text-lg md:text-xl text-white tracking-tight hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
              <span className="material-symbols-outlined text-lg">favorite</span>
            </div>
            <span className="bg-gradient-to-r from-purple-200 via-purple-100 to-white bg-clip-text text-transparent">
              Finanças do Casal
            </span>
          </button>

          {/* Nav Links Desktop */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Painel
            </button>
            <button
              onClick={() => onNavigate('transactions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'transactions'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Transações
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'reports'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Resumo Mensal
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Ajustes
            </button>
          </div>
        </div>

        {/* Right Header Utilities */}
        <div className="flex items-center gap-3">
          {/* Supabase Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
              isSupabaseConfigured
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : 'bg-purple-950/60 text-purple-300 border-purple-500/30'
            }`}
            title={
              isSupabaseConfigured
                ? 'Conectado ao Supabase Cloud Database'
                : 'Operando em armazenamento local. Configure SUPABASE_URL em /src/lib/supabase.ts para sincronizar na nuvem.'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'
              }`}
            />
            <span>{isSupabaseConfigured ? 'Supabase On' : 'Modo Local'}</span>
          </div>

          {/* Search Input */}
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar no sistema..."
              className="pl-9 pr-4 py-1.5 bg-[#1a1633] border border-purple-500/20 text-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 w-48"
            />
          </div>

          {/* Nova Transação Button */}
          <button
            onClick={onOpenNewTransaction}
            aria-label="Abrir formulário de nova transação"
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span className="hidden sm:inline">Nova Transação</span>
          </button>

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              aria-label="Alternar modo claro e escuro"
              className="p-2 text-purple-200 hover:bg-white/10 rounded-xl transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Alternar Modo Claro / Escuro"
            >
              <span className="material-symbols-outlined text-lg">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}

          {/* Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Abrir menu do perfil do usuário"
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-500/40 hover:border-purple-400 transition-colors cursor-pointer"
            >
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </button>

            {showProfileMenu && (
              <div className="absolute top-10 right-0 w-52 bg-[#1c1833] rounded-2xl shadow-2xl border border-purple-500/20 p-3 z-50 text-xs space-y-2">
                <div className="p-2 border-b border-purple-500/10">
                  <p className="font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  <span>Ajustes e Conta</span>
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Sair</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#131024]/95 backdrop-blur-xl border-t border-purple-500/20 flex items-center justify-around px-4 z-50 text-gray-400">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-0.5 ${
            currentView === 'dashboard' ? 'text-purple-400 font-bold' : 'hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[10px]">Painel</span>
        </button>

        <button
          onClick={() => onNavigate('transactions')}
          className={`flex flex-col items-center gap-0.5 ${
            currentView === 'transactions' ? 'text-purple-400 font-bold' : 'hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">receipt_long</span>
          <span className="text-[10px]">Transações</span>
        </button>

        <button
          onClick={onOpenNewTransaction}
          className="w-12 h-12 -mt-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg shadow-purple-900/50 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>

        <button
          onClick={() => onNavigate('reports')}
          className={`flex flex-col items-center gap-0.5 ${
            currentView === 'reports' ? 'text-purple-400 font-bold' : 'hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">bar_chart</span>
          <span className="text-[10px]">Resumo</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center gap-0.5 ${
            currentView === 'settings' ? 'text-purple-400 font-bold' : 'hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span className="text-[10px]">Ajustes</span>
        </button>
      </nav>
    </>
  );
};
