import React from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label }) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest ml-1">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#ADAEBC] dark:text-white text-sm font-medium"
      />
    </div>
  );
};

export default DatePicker;
