import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ action: '', page: 1 });

  useEffect(() => {
    const params = { page: filters.page };
    if (filters.action) params.action = filters.action;
    api.get('/admin/logs/', { params }).then(({ data }) => {
      setLogs(data.data || []);
      setPagination(data.pagination || {});
    }).catch(console.error);
  }, [filters]);

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-heading font-bold mb-6">Logs de Actividad</h1>

        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-text-secondary" />
          <input placeholder="Filtrar por acción..." value={filters.action}
            onChange={(e) => setFilters({ action: e.target.value, page: 1 })}
            className="input-neon pl-10 text-sm" />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-sf-text-secondary border-b border-sf-border bg-sf-elevated/30">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Objetivo</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-sf-border/30 hover:bg-sf-elevated/20">
                  <td className="py-3 px-4 text-sf-text-secondary text-xs">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">{l.admin_username}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-sf-accent/15 text-sf-accent">{l.action}</span>
                  </td>
                  <td className="py-3 px-4 text-sf-text-secondary font-mono text-xs">
                    {l.target_type} #{l.target_id}
                  </td>
                  <td className="py-3 px-4 text-sf-text-secondary font-mono text-xs">{l.ip_address}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sf-text-secondary">Sin logs registrados</td></tr>
              )}
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
