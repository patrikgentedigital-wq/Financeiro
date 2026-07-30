import React, { useState, Suspense } from 'react';
import { ViewMode } from './types';
import { initPWAInstallListener } from './utils/pwa';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ViewSkeleton } from './components/ViewSkeleton';
import { useAuth } from './contexts/AuthContext';
import { useTransactions } from './contexts/TransactionsContext';
import { useToast } from './contexts/ToastContext';
import { useTheme } from './contexts/ThemeContext';

// Lazy-loaded Views e Modal
const TransactionsView = React.lazy(() =>
  import('./components/TransactionsView').then((m) => ({ default: m.TransactionsView }))
);
const ReportsView = React.lazy(() =>
  import('./components/ReportsView').then((m) => ({ default: m.ReportsView }))
);
const SettingsView = React.lazy(() =>
  import('./components/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const NewTransactionModal = React.lazy(() =>
  import('./components/NewTransactionModal').then((m) => ({ default: m.NewTransactionModal }))
);

// Inicializar listener de instalação PWA
initPWAInstallListener();

export function App() {
  const { isAuthChecking, isAuthenticated, handleLogin, handleLogout, setUser } = useAuth();
  const {
    transactions,
    activeUser,
    pendingSyncCount,
    isNewTxModalOpen,
    editingTransaction,
    activeConflict,
    handleAddTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
    handleResetData,
    handleOpenEditModal,
    handleCloseModal,
    handleKeepLocalConflict,
    handleUseServerConflict,
    handleCancelConflict,
    setIsNewTxModalOpen,
  } = useTransactions();
  const { toasts, dismissToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  const handleSearchChange = (query: string) => {
    setGlobalSearchQuery(query);
    if (query.trim().length > 0 && currentView !== 'transactions') {
      setCurrentView('transactions');
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0f0c1b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-purple-300">
          <span className="material-symbols-outlined text-4xl animate-spin text-purple-400">
            progress_activity
          </span>
          <p className="text-xs font-semibold tracking-wide">Validando sessão do casal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#0f0c1b] text-white selection:bg-purple-500 selection:text-white font-['Inter',sans-serif]">
      {/* Navigation Bar */}
      <Navigation
        currentView={currentView}
        onNavigate={setCurrentView}
        user={activeUser}
        transactions={transactions}
        onOpenNewTransaction={() => {
          setIsNewTxModalOpen(true);
        }}
        globalSearchQuery={globalSearchQuery}
        onSearchChange={handleSearchChange}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Container */}
      <main className="pt-24 pb-20 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Banner Customizado de Instalação PWA */}
        <PWAInstallBanner />

        <ErrorBoundary>
          <Suspense fallback={<ViewSkeleton />}>
            {currentView === 'dashboard' && (
              <DashboardView
                user={activeUser}
                transactions={transactions}
                onNavigate={setCurrentView}
                onOpenNewTransaction={() => {
                  setIsNewTxModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleOpenEditModal}
                onAddTransaction={handleAddTransaction}
              />
            )}

            {currentView === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                onOpenNewTransaction={() => {
                  setIsNewTxModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleOpenEditModal}
                initialSearchQuery={globalSearchQuery}
              />
            )}

            {currentView === 'reports' && (
              <ReportsView transactions={transactions} user={activeUser} />
            )}

            {currentView === 'settings' && (
              <SettingsView
                user={activeUser}
                onUpdateUser={setUser}
                onResetData={handleResetData}
                pendingSyncCount={pendingSyncCount}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* New / Edit Transaction Modal */}
      <Suspense fallback={null}>
        {isNewTxModalOpen && (
          <NewTransactionModal
            isOpen={isNewTxModalOpen}
            onClose={handleCloseModal}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            initialTx={editingTransaction}
            user={activeUser}
          />
        )}
      </Suspense>

      {/* OCC Concurrency Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={Boolean(activeConflict)}
        localTx={activeConflict?.localTx || null}
        serverTx={activeConflict?.serverTx || null}
        onKeepLocal={handleKeepLocalConflict}
        onUseServer={handleUseServerConflict}
        onCancel={handleCancelConflict}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
