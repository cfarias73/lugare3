import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { MOCK_HOSTS } from '../../constants/adminConstants';

const Hosts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Gestión de Anfitriones</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Espacios</th>
              <th className="p-4">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                </tr>
              ))
            ) : MOCK_HOSTS.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8">
                  <EmptyState title="No hay anfitriones" description="Aún no hay anfitriones registrados en la plataforma." icon="storefront" />
                </td>
              </tr>
            ) : (
              MOCK_HOSTS.map((host) => (
                <tr key={host.id} className="text-sm dark:text-slate-300">
                  <td className="p-4">{host.name}</td>
                  <td className="p-4">{host.email}</td>
                  <td className="p-4">{host.spaces}</td>
                  <td className="p-4">{host.rating}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default Hosts;
