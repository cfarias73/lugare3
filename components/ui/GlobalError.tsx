import React from 'react';

interface GlobalErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const GlobalError: React.FC<GlobalErrorProps> = ({
  title = 'Algo salió mal',
  message = 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.',
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-white dark:bg-background-dark text-center">
      <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <span className="material-icons-round text-5xl text-red-500">error_outline</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">{title}</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-orange-600 transition-all"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  );
};

export default GlobalError;
