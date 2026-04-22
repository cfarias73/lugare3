import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { toast } from 'sonner';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  console.error('Uncaught error:', error);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-background-dark text-center">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">¡Ups! Algo salió mal.</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Ha ocurrido un error inesperado en la aplicación.</p>
      <button 
        className="bg-primary text-white font-bold py-3 px-6 rounded-full shadow-lg"
        onClick={() => {
          resetErrorBoundary();
          window.location.reload();
        }}
      >
        Recargar página
      </button>
    </div>
  );
};

interface Props {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error('Uncaught error:', error);
        toast.error('Algo salió mal. Por favor, intenta de nuevo más tarde.');
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
