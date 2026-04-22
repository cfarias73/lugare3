import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { MOCK_USERS } from '../../constants/adminConstants';

const Users: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Gestión de Usuarios</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Fecha de unión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))
            ) : MOCK_USERS.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8">
                  <EmptyState title="No hay usuarios" description="Aún no hay usuarios registrados en la plataforma." icon="people" />
                </td>
              </tr>
            ) : (
              MOCK_USERS.map((user) => (
                <tr key={user.id} className="text-sm dark:text-slate-300">
                  <td className="p-4">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.joined}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default Users;
