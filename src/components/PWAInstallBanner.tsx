import React, { useState, useEffect } from 'react';
import { isPWAInstallable, promptPWAInstall, isIOSSafari, isStandalonePWA, subscribePWAStatus } from '../utils/pwa';

export const PWAInstallBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState<boolean>(isPWAInstallable());
  const [isIOS, setIsIOS] = useState<boolean>(isIOSSafari());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('financas_casal_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    const unsub = subscribePWAStatus(() => {
      setCanInstall(isPWAInstallable());
      setIsIOS(isIOSSafari());
    });
    return () => unsub();
  }, []);

  if (isStandalonePWA() || isDismissed) {
    return null;
  }

  if (!canInstall && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('financas_casal_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    const installed = await promptPWAInstall();
    if (installed) {
      setIsDismissed(true);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-3xl glass-card border border-purple-500/30 bg-gradient-to-r from-[#191333] via-[#131024] to-[#1a1238] shadow-2xl relative animate-in fade-in">
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        className="absolute top-3 right-3 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-purple-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
        title="Fechar aviso"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>

      {/* Instalação direta para Android / Chrome Desktop */}
      {canInstall && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/50 shrink-0">
              <span className="material-symbols-outlined text-2xl">install_mobile</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Instale o App Finanças no seu Dispositivo
              </h3>
              <p className="text-xs text-purple-200/70">
                Acesse instantaneamente da sua tela de início, mesmo sem internet!
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="px-5 py-2.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Instalar App</span>
          </button>
        </div>
      )}

      {/* Instrução visual especial para iOS Safari */}
      {isIOS && !canInstall && (
        <div className="space-y-3 pr-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">apple</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Instalar no iPhone / iPad (Safari)
              </h3>
              <p className="text-xs text-purple-200/70">
                Adicione o app à sua Tela de Início em apenas 2 passos simples:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-[#0f0c1b]/80 border border-purple-500/20 flex items-center gap-2.5 text-purple-200">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-extrabold flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Toque no botão <strong className="text-white">Compartilhar</strong> (ícone ⎋ abaixo)</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0f0c1b]/80 border border-purple-500/20 flex items-center gap-2.5 text-purple-200">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-extrabold flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Selecione <strong className="text-white">Adicionar à Tela de Início ➕</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
