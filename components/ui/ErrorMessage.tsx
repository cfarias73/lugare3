import React from 'react';

interface ErrorMessageProps {
  message?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  return (
    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1 uppercase tracking-widest">
      {message}
    </p>
  );
};
