import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, X, Image as ImageIcon, Video, Calendar, Clock, Shield } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', page: 1, genre: '', sort: '-created_at' });
  const [genres, setGenres] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', year: 2024, duration_min: 120,
    poster_url: '', backdrop_url: '', trailer_youtube_id: '',
    min_plan_id: 1, is_active: true, genre_ids: []
  });

  const fetchGenres = async () => {
    try {
      const { data } = await api.get('/genres/');
      setGenres(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchMovies = async () => {
    try {
      const params = { page: filters.page, sort: filters.sort };
      if (filters.search) params.search = filters.search;
      if (filters.genre) params.genre = filters.genre;
      const { data } = await api.get('/admin/movies/', { params });
      setMovies(data.data || []);
      setPagination(data.pagination || {});
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchGenres();
  }, []);

  useEffect(() => { fetchMovies(); }, [filters]);

  const toggleActive = async (movie) => {
    try {
      if (movie.is_active) {
        await api.delete(`/admin/movies/${movie.id}/`);
        toast.success('Película desactivada');
      } else {
        await api.put(`/admin/movies/${movie.id}/`, { is_active: true });
        toast.success('Película activada');
      }
      fetchMovies();
    } catch (e) { toast.error('Error al cambiar estado'); }
  };

  const handleOpenModal = async (movie = null) => {
    if (movie) {
      setEditingId(movie.id);
      try {
        // Fetch full details because MovieList doesn't return description, backdrop, etc.
        const { data } = await api.get(`/admin/movies/${movie.id}/`);
        const fullMovie = data.data;
        setFormData({
          title: fullMovie.title || '',
          description: fullMovie.description || '',
          year: fullMovie.year || 2024,
          duration_min: fullMovie.duration_min || 120,
          poster_url: fullMovie.poster_url || '',
          backdrop_url: fullMovie.backdrop_url || '',
          trailer_youtube_id: fullMovie.trailer_youtube_id || '',
          min_plan_id: fullMovie.min_plan_id || 1,
          is_active: fullMovie.is_active !== false,
          genre_ids: fullMovie.genres ? fullMovie.genres.map(g => g.id) : []
        });
      } catch (e) {
        toast.error('Error al cargar la información de la película');
        return;
      }
    } else {
      setEditingId(null);
      setFormData({
        title: '', description: '', year: new Date().getFullYear(), duration_min: 120,
        poster_url: '', backdrop_url: '', trailer_youtube_id: '', min_plan_id: 1, is_active: true, genre_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/movies/${editingId}/`, formData);
        toast.success('Película actualizada');
      } else {
        await api.post('/admin/movies/', formData);
        toast.success('Película creada exitosamente');
      }
      setIsModalOpen(false);
      fetchMovies();
    } catch (e) {
      toast.error('Error al guardar película');
    }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-black text-white">Gestión de Películas</h1>
          <button onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 px-4 py-2 bg-sf-accent text-[#060611] font-bold rounded-xl hover:bg-sf-accent-secondary transition-all shadow-[0_0_15px_rgba(0,212,170,0.3)] hover:scale-105">
            <Plus className="w-5 h-5" /> Nueva Película
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-text-secondary" />
            <input placeholder="Buscar por título..." value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.15)' }} />
          </div>
          
          <select value={filters.genre} onChange={(e) => setFilters({ ...filters, genre: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl text-sm text-white outline-none bg-[#12121A] border border-sf-accent/20 cursor-pointer">
            <option value="">Todos los géneros</option>
            {genres.map(g => <option key={g.id} value={g.slug}>{g.name}</option>)}
          </select>

          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl text-sm text-white outline-none bg-[#12121A] border border-sf-accent/20 cursor-pointer">
            <option value="-created_at">Más Recientes</option>
            <option value="title">A - Z (Alfabético)</option>
            <option value="-title">Z - A</option>
            <option value="-year">Año (Más nuevos)</option>
            <option value="year">Año (Más antiguos)</option>
            <option value="-duration_min">Mayor Duración</option>
            <option value="duration_min">Menor Duración</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-sf-text-secondary border-b border-sf-border bg-sf-elevated/30">
                  <th className="py-4 px-5 font-semibold">Película</th>
                  <th className="py-4 px-5 font-semibold">Año / Duración</th>
                  <th className="py-4 px-5 font-semibold">Plan Mínimo</th>
                  <th className="py-4 px-5 font-semibold">Estado</th>
                  <th className="py-4 px-5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m.id} className="border-b border-sf-border/30 hover:bg-sf-elevated/20 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-4">
                        <img src={m.poster_url || `https://via.placeholder.com/40x60/1C1C2A/FFFFFF?text=No+Img`} alt="" 
                          className="w-10 h-14 rounded-lg object-cover bg-sf-elevated shadow-md" />
                        <div>
                          <p className="font-bold text-white mb-0.5">{m.title}</p>
                          <p className="text-[10px] text-sf-text-secondary">ID: {m.id} • {m.trailer_youtube_id ? 'Tiene Tráiler' : 'Sin Tráiler'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-sf-text-secondary">
                      <p>{m.year}</p>
                      <p className="text-xs">{m.duration_min} min</p>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        m.min_plan_id === 1 ? 'bg-gray-500/20 text-gray-300' :
                        m.min_plan_id === 2 ? 'bg-blue-500/20 text-blue-400' :
                        m.min_plan_id === 3 ? 'bg-purple-500/20 text-purple-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        Plan {m.min_plan_id}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        m.is_active !== false ? 'bg-sf-accent/10 text-sf-accent border border-sf-accent/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>{m.is_active !== false ? 'Activa' : 'Inactiva'}</span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleOpenModal(m)} title="Editar Película"
                          className="p-2 rounded-lg hover:bg-sf-accent/10 hover:text-sf-accent transition-colors text-sf-text-secondary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(m)} title={m.is_active ? 'Desactivar' : 'Activar'}
                          className={`p-2 rounded-lg transition-colors ${m.is_active ? 'hover:bg-yellow-500/10 hover:text-yellow-500 text-sf-text-secondary' : 'hover:bg-sf-accent/10 hover:text-sf-accent text-yellow-500'}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                            const result = await Swal.fire({
                              title: '¿Eliminar permanentemente?',
                              text: `Estás a punto de borrar "${m.title}". Esto no se puede deshacer.`,
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#e50914',
                              cancelButtonColor: '#12121A',
                              confirmButtonText: 'Sí, eliminar',
                              cancelButtonText: 'Cancelar',
                              background: '#0C0C1D',
                              color: '#fff'
                            });
                            
                            if(result.isConfirmed) {
                              try {
                                await api.delete(`/admin/movies/${m.id}/?hard=true`);
                                Swal.fire({
                                  title: 'Eliminado',
                                  text: 'La película ha sido borrada.',
                                  icon: 'success',
                                  background: '#0C0C1D',
                                  color: '#fff',
                                  confirmButtonColor: '#00D4AA'
                                });
                                fetchMovies();
                              } catch (e) {
                                toast.error('Error al eliminar película');
                              }
                            }
                          }} title="Eliminar Definitivamente"
                          className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sf-text-secondary">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {movies.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-sf-text-secondary">No se encontraron películas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-4 py-2 rounded-lg bg-sf-secondary text-sm disabled:opacity-30 border border-sf-border hover:border-sf-accent/50 transition-colors">← Anterior</button>
            <span className="text-sm text-sf-text-secondary py-2">Pág {pagination.page} de {pagination.total_pages}</span>
            <button disabled={filters.page >= pagination.total_pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-4 py-2 rounded-lg bg-sf-secondary text-sm disabled:opacity-30 border border-sf-border hover:border-sf-accent/50 transition-colors">Siguiente →</button>
          </div>
        )}

        {/* Modal CRUD */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060611]/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-[#0C0C1D] border border-sf-accent/20 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-sf-accent/10">
                  <h3 className="text-lg font-black text-white">{editingId ? 'Editar Película' : 'Añadir Nueva Película'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-sf-text-secondary hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                  <form id="movieForm" onSubmit={handleSave} className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 block">Título de la película</label>
                      <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent outline-none transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Año</label>
                        <input type="number" required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Duración (min)</label>
                        <input type="number" required value={formData.duration_min} onChange={e => setFormData({...formData, duration_min: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 flex items-center gap-1"><Shield className="w-3.5 h-3.5"/> Plan Mínimo Requerido</label>
                        <select value={formData.min_plan_id} onChange={e => setFormData({...formData, min_plan_id: parseInt(e.target.value)})}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#12121A] border border-white/10 text-white focus:border-sf-accent outline-none">
                          <option value={1}>Plan Gratuito (1)</option>
                          <option value={2}>Plan Básico (2)</option>
                          <option value={3}>Plan Intermedio (3)</option>
                          <option value={4}>Plan Premium (4)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 flex items-center gap-1">Géneros (Múltiple)</label>
                        <select multiple value={formData.genre_ids} onChange={e => {
                          const options = [...e.target.selectedOptions];
                          const values = options.map(opt => parseInt(opt.value));
                          setFormData({...formData, genre_ids: values});
                        }}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#12121A] border border-white/10 text-white focus:border-sf-accent outline-none h-24 custom-scrollbar">
                          {genres.map(g => (
                            <option key={g.id} value={g.id} className="p-1">{g.name}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-sf-text-secondary mt-1 ml-1">Ctrl/Cmd + clic para seleccionar varios.</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 block">Sinopsis</label>
                      <textarea rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent outline-none resize-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5"/> URL del Póster</label>
                        <input type="url" value={formData.poster_url} onChange={e => setFormData({...formData, poster_url: e.target.value})}
                          placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-sf-text-secondary uppercase mb-1.5 flex items-center gap-1"><Video className="w-3.5 h-3.5"/> ID de YouTube (Tráiler)</label>
                        <input value={formData.trailer_youtube_id} onChange={e => setFormData({...formData, trailer_youtube_id: e.target.value})}
                          placeholder="Ej: dQw4w9WgXcQ" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent outline-none" />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-sf-accent/10 bg-[#060611] flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" form="movieForm" className="px-6 py-2.5 rounded-xl text-sm font-black bg-sf-accent text-[#060611] hover:bg-sf-accent-secondary shadow-[0_0_15px_rgba(0,212,170,0.3)] transition-all">
                    {editingId ? 'Guardar Cambios' : 'Crear Película'}
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </AdminLayout>
  );
}
