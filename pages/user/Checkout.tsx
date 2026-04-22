
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { toast } from 'sonner';
import { createBooking } from '../../src/services/userService';
import { supabase } from '../../lib/supabaseClient';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [venue, setVenue] = useState<any>(null);

  useEffect(() => {
    supabase.from('venues').select('*').eq('id', id).single().then(({ data }) => setVenue(data));
  }, [id]);

  if (!venue) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  const totalPrice = venue.price_per_hour + 56000; // Simplified total

  const handlePayment = async () => {
    const newErrors: Record<string, string> = {};
    if (!cardNumber) newErrors.cardNumber = 'Requerido';
    if (!expiry) newErrors.expiry = 'Requerido';
    if (!cvc) newErrors.cvc = 'Requerido';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor, completa los datos de la tarjeta.');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setIsProcessing(true);
    
    try {
      await createBooking({
        user_id: user.id, // Assuming user context has id
        venue_id: venue.id,
        event_date: '2025-08-12', // Mocked
        start_time: '19:00:00',
        end_time: '00:00:00',
        guest_count: 10, // Mocked
        total_price: totalPrice
      });
      
      toast.success('¡Pago Procesado y Reserva Exitosa!');
      navigate('/user/bookings');
    } catch (e) {
      console.error(e);
      toast.error('Error al procesar la reserva');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen max-w-md mx-auto flex flex-col transition-colors">
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <span className="material-icons-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold font-display">Reserva y Pago</h1>
        </div>
        <div className="w-10 h-10 flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 rounded-full">
          <span className="material-icons-outlined text-primary">lock</span>
        </div>
      </header>

      <main className="pb-40 flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Detalles</span>
            <span className="text-[10px] font-bold text-primary uppercase">Método de pago</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Confirmación</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3 transition-all duration-500"></div>
          </div>
        </div>

        <section className="px-6 space-y-4">
          {/* Booking Summary */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
              <img alt="Venue" className="w-full h-full object-cover" src={venue.image} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base leading-tight font-display">{venue.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-icons-outlined text-primary text-sm">place</span>
                <span className="text-xs text-slate-500">{venue.city}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600">12 Ago, 2025</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600">19:00 - 00:00</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold mb-4 text-[10px] uppercase tracking-wider text-slate-400">Resumen de costos</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Alquiler Salón (5h)</span>
                <span className="font-medium">${venue.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Servicio Catering</span>
                <span className="font-medium">$56.000</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="font-bold text-slate-800 dark:text-white">Total</span>
                <span className="font-bold text-primary text-lg font-display">${venue.price + 56000}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 ml-1">Método de pago</h4>
            <label className="relative flex items-center p-4 bg-white dark:bg-surface-dark border-2 border-primary rounded-2xl cursor-pointer">
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center mr-4">
                <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
              </div>
              <div className="flex-1">
                <span className="font-bold block text-sm">Tarjeta de Crédito / Débito</span>
              </div>
              <span className="material-icons-outlined text-slate-400">credit_card</span>
            </label>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cardNumber" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Número de tarjeta</label>
                <div className="relative">
                  <input 
                    id="cardNumber"
                    className={`w-full bg-white dark:bg-slate-800 border ${errors.cardNumber ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20`} 
                    placeholder="•••• •••• •••• 4582" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  {errors.cardNumber && <p className="text-red-500 text-[10px] mt-1">{errors.cardNumber}</p>}
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-icons-outlined text-slate-400">credit_card</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="expiry" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Vencimiento</label>
                  <input 
                    id="expiry"
                    className={`w-full bg-white dark:bg-slate-800 border ${errors.expiry ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20`} 
                    placeholder="MM/AA" 
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                  {errors.expiry && <p className="text-red-500 text-[10px] mt-1">{errors.expiry}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cvc" className="text-[10px] font-bold text-slate-500 uppercase ml-1">CVV</label>
                  <input 
                    id="cvc"
                    className={`w-full bg-white dark:bg-slate-800 border ${errors.cvc ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20`} 
                    placeholder="•••" 
                    type="password" 
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                  />
                  {errors.cvc && <p className="text-red-500 text-[10px] mt-1">{errors.cvc}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 px-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex gap-4">
            <span className="material-icons-outlined text-blue-500">info</span>
            <div>
              <h5 className="font-bold text-blue-700 dark:text-blue-400 text-sm">Política de cancelación</h5>
              <p className="text-[11px] text-blue-600 dark:text-blue-500 mt-1 leading-relaxed">Cancelación gratuita hasta 7 días antes. Pasado ese tiempo no es reembolsable.</p>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 px-6 pt-4 pb-10 flex flex-col gap-3 shadow-2xl z-50">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 text-sm">Total a pagar</span>
          <span className="text-xl font-bold font-display">${totalPrice.toLocaleString()}</span>
        </div>
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
            isProcessing 
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-primary hover:bg-orange-600 shadow-primary/20 active:scale-95'
          }`}
        >
          {isProcessing ? (
            <>
              <span className="material-icons-outlined text-lg animate-spin">autorenew</span>
              Procesando...
            </>
          ) : (
            <>
              <span className="material-icons-outlined text-lg">lock</span>
              Confirmar y pagar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
