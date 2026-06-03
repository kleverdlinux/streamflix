import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import PlanBadge from '../../components/PlanBadge';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', page: 1 });

  const fetchUsers = async () => {
    const params = { page: filters.page };
    if (filters.search) params.search = filters.search;
    try {
      const { data } = await api.get('/admin/users/', { params });
      setUsers(data.data || []);
      setPagination(data.pagination || {});
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchUsers(); }, [filters]);

  const toggleUser = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}/`, { is_active: !u.is_active });
      toast.success(u.is_active ? 'Usuario suspendido' : 'Usuario activado');
      fetchUsers();
    } catch (e) { toast.error('Error'); }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-heading font-bold mb-6">Gestión de Usuarios</h1>

        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-text-secondary" />
          <input placeholder="Buscar usuario..." value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            className="input-neon pl-10 text-sm" />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-sf-text-secondary border-b border-sf-border bg-sf-elevated/30">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Registro</th>
                <th className="py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-sf-border/30 hover:bg-sf-elevated/20">
                  <td className="py-3 px-4 font-medium">{u.username}</td>
                  <td className="py-3 px-4 text-sf-text-secondary">{u.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.plan_id || 1}
                      onChange={async (e) => {
                        try {
                          await api.put(`/admin/users/${u.id}/`, { plan_id: parseInt(e.target.value) });
                          toast.success('Plan actualizado');
                          fetchUsers();
                        } catch (err) {
                          toast.error('Error al cambiar plan');
                        }
                      }}
                      className="bg-sf-elevated border border-sf-border rounded px-2 py-1 text-xs text-white"
                    >
                      <option value={1}>Gratuito</option>
                      <option value={2}>Básico</option>
                      <option value={3}>Intermedio</option>
                      <option value={4}>Premium</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      u.is_active ? 'bg-sf-accent-tertiary/20 text-sf-accent-tertiary' : 'bg-red-500/20 text-red-400'
                    }`}>{u.is_active ? 'Activo' : 'Suspendido'}</span>
                  </td>
                  <td className="py-3 px-4 text-sf-text-secondary text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleUser(u)}
                      className={`text-xs px-3 py-1 rounded-lg ${
                        u.is_active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-sf-accent-tertiary/20 text-sf-accent-tertiary hover:bg-sf-accent-tertiary/30'
                      }`}>
                      {u.is_active ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-30">← Anterior</button>
            <span className="text-sm text-sf-text-secondary py-2">Pág {pagination.page} de {pagination.total_pages}</span>
            <button disabled={filters.page >= pagination.total_pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-30">Siguiente →</button>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
