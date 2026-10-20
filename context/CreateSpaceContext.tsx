import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CreateSpaceData {
  name: string;
  type: string;
  capacity: string; // legado = max_capacity
  description: string;
  images: string[];
  category: string;
  // Ubicación
  address: string;
  city: string;
  postalCode: string;
  lat: string;
  lng: string;
  // Precios flexibles
  basePrice: string;
  baseCapacity: string;
  maxCapacity: string;
  includedHours: string;
  extraPersonPrice: string;
  extraHourPrice: string;
  maxExtraHours: string;
  // Compatibilidad
  pricePerHour: string;
  minHours: string;
  sizeSqm: string;
  // Reglas
  rules: string[];
  amenities: string[];
  // Política de cancelación
  cancellationType: 'non_refundable' | 'flexible' | 'custom';
  cancellationDays: string;
  cancellationTiers: { days: string; percent: string }[];
  // Horarios de turnos
  schedules?: {
    morning: { enabled: boolean; start: string; end: string };
    afternoon: { enabled: boolean; start: string; end: string };
    night: { enabled: boolean; start: string; end: string };
  };
}

interface CreateSpaceContextType {
  data: CreateSpaceData;
  updateData: (newData: Partial<CreateSpaceData>) => void;
  setData: (data: CreateSpaceData) => void;
  step: number;
  setStep: (step: number) => void;
}

const defaultData: CreateSpaceData = {
  name: '',
  type: 'Jardín',
  capacity: '',
  description: '',
  images: [],
  category: '',
  address: '',
  city: 'CDMX',
  postalCode: '',
  lat: '',
  lng: '',
  basePrice: '',
  baseCapacity: '',
  maxCapacity: '',
  includedHours: '5',
  extraPersonPrice: '',
  extraHourPrice: '',
  maxExtraHours: '6',
  pricePerHour: '',
  minHours: '5',
  sizeSqm: '',
  rules: [],
  amenities: [],
  cancellationType: 'non_refundable',
  cancellationDays: '30',
  cancellationTiers: [{ days: '60', percent: '100' }, { days: '30', percent: '50' }],
  schedules: {
    morning: { enabled: true, start: '08:00', end: '13:00' },
    afternoon: { enabled: true, start: '14:00', end: '19:00' },
    night: { enabled: true, start: '20:00', end: '02:00' },
  },
};

const CreateSpaceContext = createContext<CreateSpaceContextType | undefined>(undefined);

export const CreateSpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CreateSpaceData>(defaultData);
  const [step, setStep] = useState(1);

  const updateData = (newData: Partial<CreateSpaceData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  return (
    <CreateSpaceContext.Provider value={{ data, updateData, setData, step, setStep }}>
      {children}
    </CreateSpaceContext.Provider>
  );
};

export const useCreateSpace = () => {
  const context = useContext(CreateSpaceContext);
  if (!context) throw new Error('useCreateSpace must be used within a CreateSpaceProvider');
  return context;
};
