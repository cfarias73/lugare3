import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { EmptyState } from '../../components/ui/EmptyState';

const Disputes: React.FC = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Centro de Disputas</h1>
      <EmptyState 
        title="No hay disputas"
        description="Actualmente no hay ninguna disputa abierta que requiera tu atención."
        icon="support_agent"
      />
    </AdminLayout>
  );
};

export default Disputes;
