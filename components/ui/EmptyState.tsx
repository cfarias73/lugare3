import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon = 'inbox', action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <span className="material-icons-round text-3xl text-slate-400">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">{description}</p>
      {action && (
        <button 
          onClick={action.onClick}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
