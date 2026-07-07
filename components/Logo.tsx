import React, { useState } from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 36, showText = true, textClassName = '' }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {!logoError ? (
        <img
          src="/logolugare.png"
          alt="Lugare"
          className="object-contain rounded-xl"
          style={{ width: size, height: size }}
          onError={() => setLogoError(true)}
        />
      ) : (
        <div
          className="rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30"
          style={{ width: size, height: size }}
        >
          <span className="material-icons-round text-white" style={{ fontSize: size * 0.55 }}>
            location_on
          </span>
        </div>
      )}
      {showText && (
        <span className={`font-display font-bold tracking-tight text-slate-900 dark:text-white ${textClassName}`}>
          LUGARE
        </span>
      )}
    </div>
  );
};

export default Logo;
