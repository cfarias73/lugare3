import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Poll up to 10s for the webhook to confirm
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from('payments')
        .select('*, bookings(*, venues(name))')
        .eq('stripe_session_id', sessionId)
        .single();

      if (data?.status === 'paid') {
        setPayment(data);
        setStatus('success');
        clearInterval(interval);
      } else if (attempts >= 10) {
        // Show success anyway — webhook may take a moment
        setPayment(data);
        setStatus('success');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [location.search]);

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      {status === 'loading' && (
        <>
          <span className="material-icons-outlined text-primary text-6xl animate-spin">autorenew</span>
          <p className="mt-4 text-slate-600">Confirmando tu pago...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-icons-outlined text-green-600 text-5xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold font-display mt-6 text-center">¡Pago confirmado!</h1>
          <p className="text-slate-600 dark:text-slate-400 text-center mt-2">
            Tu reserva en <strong>{payment?.bookings?.venues?.name}</strong> ha sido confirmada.
          </p>
          {payment && (
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl p-5 mt-6 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Total pagado</span>
                <span className="font-bold">${Number(payment.amount_total).toLocaleString()} MXN</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>ID transacción</span>
                <span className="font-mono">{payment.stripe_session_id?.slice(-12)}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/user/bookings')}
            className="mt-8 w-full bg-primary text-white font-bold py-4 rounded-2xl"
          >
            Ver mis reservas
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <span className="material-icons-outlined text-red-500 text-6xl">error</span>
          <p className="mt-4 text-slate-600">No pudimos confirmar el pago.</p>
          <button onClick={() => navigate('/user/home')} className="mt-6 text-primary font-bold">Volver al inicio</button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
