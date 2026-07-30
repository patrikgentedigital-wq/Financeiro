import { useState, useEffect } from 'react';

export function SWUpdateToast() {
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      setShowUpdateToast(true);
    };

    // Detectar quando um novo SW assumiu o controle
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Verificar por updates periodicamente (a cada 60min)
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update();
      });
    }, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(interval);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdateToast(false);
  };

  if (!showUpdateToast) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[60] toast-animate">
      <div className="glass-card rounded-xl p-4 shadow-2xl border border-indigo-500/30">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-indigo-400 text-xl mt-0.5">
            system_update
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Nova versão disponível</p>
            <p className="text-xs text-purple-200/70 mt-0.5">
              Recarregue para aplicar as atualizações.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-purple-300/50 hover:text-white transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Dispensar notificação de atualização"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleReload}
            className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
            aria-label="Recarregar aplicação"
          >
            Recarregar Agora
          </button>
          <button
            onClick={handleDismiss}
            className="py-2 px-4 rounded-lg text-xs text-purple-300 hover:text-white hover:bg-purple-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
            aria-label="Atualizar depois"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
