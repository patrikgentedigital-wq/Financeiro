import { useState, useEffect } from 'react';

interface OnboardingOverlayProps {
  hasTransactions: boolean;
  onDismiss: () => void;
  onAddFirstTransaction: () => void;
}

const ONBOARDING_KEY = 'financas_casal_onboarding_done';

export function OnboardingOverlay({ hasTransactions, onDismiss, onAddFirstTransaction }: OnboardingOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done && !hasTransactions) {
      setIsVisible(true);
    }
  }, [hasTransactions]);

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
    onDismiss();
  };

  const handleStart = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
    onAddFirstTransaction();
  };

  if (!isVisible) return null;

  const steps = [
    {
      icon: '💑',
      title: 'Bem-vindos ao Finanças do Casal!',
      description: 'Gerencie as finanças do casal de forma simples e transparente. Cada um registra seus gastos e o app calcula automaticamente quem deve para quem.',
    },
    {
      icon: '💳',
      title: 'Registre despesas e receitas',
      description: 'Adicione transações compartilhadas (do casal) ou individuais. Defina quem pagou e a categoria — o app organiza tudo automaticamente.',
    },
    {
      icon: '⚖️',
      title: 'Acerto de Contas Automático',
      description: 'No Dashboard, veja em tempo real quem está devendo para quem. Quando quiser, registre a quitação com um clique — sem planilhas, sem discussão.',
    },
    {
      icon: '📊',
      title: 'Relatórios e Metas',
      description: 'Acompanhe gastos por categoria, defina orçamentos mensais e crie metas de poupança. Exporte relatórios em PDF ou CSV sempre que precisar.',
    },
  ];

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="glass-card rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-8 bg-purple-500' : 'w-1.5 bg-purple-500/30'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="text-5xl sm:text-6xl">{step.icon}</div>

        {/* Content */}
        <div className="space-y-3">
          <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold text-white">
            {step.title}
          </h2>
          <p className="text-sm sm:text-base text-purple-200/80 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          {currentStep < steps.length - 1 ? (
            <>
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
                aria-label="Próximo passo"
              >
                Próximo
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-purple-300/60 hover:text-purple-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                aria-label="Pular introdução"
              >
                Pular introdução
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStart}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
                aria-label="Adicionar primeira transação"
              >
                ✨ Adicionar Primeira Transação
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-purple-300/60 hover:text-purple-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                aria-label="Explorar o app"
              >
                Explorar primeiro
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
