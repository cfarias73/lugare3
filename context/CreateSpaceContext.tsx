import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CreateSpaceData {
  name: string;
  type: string;
  capacity: string;
  description: string;
  images: string[];
  category: string;
  // Ubicación
  address: string;
  city: string;
  lat: string;
  lng: string;
  // Precio
  pricePerHour: string;
  minHours: string;
  extraHourPrice: string;
  sizeSqm: string;
  // Reglas
  rules: string[];
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
  lat: '',
  lng: '',
  pricePerHour: '',
  minHours: '4',
  extraHourPrice: '',
  sizeSqm: '',
  rules: [],
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
