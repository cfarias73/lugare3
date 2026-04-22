import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreateSpaceData {
  name: string;
  type: string;
  capacity: string;
  description: string;
  images: string[];
}

interface CreateSpaceContextType {
  data: CreateSpaceData;
  updateData: (newData: Partial<CreateSpaceData>) => void;
  setData: (data: CreateSpaceData) => void;
  step: number;
  setStep: (step: number) => void;
}

const CreateSpaceContext = createContext<CreateSpaceContextType | undefined>(undefined);

export const CreateSpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CreateSpaceData>({
    name: '',
    type: 'Jardín',
    capacity: '',
    description: '',
    images: [],
  });
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
