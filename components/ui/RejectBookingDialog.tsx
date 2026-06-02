import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  busy?: boolean;
}

const PRESETS = [
  'Fecha ya no disponible',
  'Capacidad insuficiente',
  'Tipo de evento no permitido',
  'Información incompleta',
];

const RejectBookingDialog: React.FC<Props> = ({ isOpen, onClose, onConfirm, busy }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  const canSubmit = reason.trim().length >= 3;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={busy ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-surface-dark rounded-[32px] p-7 shadow-2xl w-full max-w-sm relative z-10 border border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-xl font-bold dark:text-white mb-2 font-display">Rechazar reserva</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Indica un motivo. El huésped lo recibirá en su notificación.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={250}
              placeholder="Escribe el motivo..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={busy}
                className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={!canSubmit || busy}
                onClick={() => onConfirm(reason.trim())}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {busy ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RejectBookingDialog;
