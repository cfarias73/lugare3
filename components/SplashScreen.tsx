import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, durationMs = 3000 }) => {
  const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    // 1. Initiate fade in right away
    const fadeInTimer = setTimeout(() => {
      setFadeState('visible');
    }, 50);

    // 2. Initiate fade out 500ms before duration ends
    const fadeOutTimer = setTimeout(() => {
      setFadeState('out');
    }, Math.max(durationMs - 500, 1000));

    // 3. Complete and notify parent
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out select-none ${
        fadeState === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-700 ease-out transform ${
          fadeState === 'in'
            ? 'opacity-0 scale-90 translate-y-3'
            : fadeState === 'visible'
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-100 scale-105'
        }`}
      >
        {!logoError ? (
          <img
            src="/logolugare.png"
            alt="Lugare Logo"
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-sm"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
            <span className="material-icons-round text-white text-6xl">
              location_on
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-display text-4xl font-extrabold tracking-tight text-slate-900">
            LUGARE
          </span>
          <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Marketplace de Eventos
          </span>
        </div>
      </div>

      {/* Subtle loader bar at the bottom */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className="w-full h-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
