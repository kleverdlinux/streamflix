import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useMovieStore = create((set, get) => ({
  watchlist: [],
  watchlistIds: new Set(),

  fetchWatchlist: async (userId) => {
    try {
      const { data } = await api.get(`/users/${userId}/watchlist/`);
      const movies = data.data || [];
      set({
        watchlist: movies,
        watchlistIds: new Set(movies.map((m) => m.id)),
      });
    } catch (e) {
      console.error('Failed to fetch watchlist:', e);
    }
  },

  addToWatchlist: async (userId, movieId) => {
    try {
      await api.post(`/users/${userId}/watchlist/`, { movie_id: movieId });
      set((s) => ({
        watchlistIds: new Set([...s.watchlistIds, movieId]),
      }));
      toast.success('Agregado a Mi Lista');
    } catch (e) {
      toast.error('Error al agregar a la lista');
    }
  },

  removeFromWatchlist: async (userId, movieId) => {
    try {
      await api.delete(`/users/${userId}/watchlist/${movieId}/`);
      set((s) => {
        const newIds = new Set(s.watchlistIds);
        newIds.delete(movieId);
        return {
          watchlist: s.watchlist.filter((m) => m.id !== movieId),
          watchlistIds: newIds,
        };
      });
      toast.success('Eliminado de Mi Lista');
    } catch (e) {
      toast.error('Error al eliminar de la lista');
    }
  },

  isInWatchlist: (movieId) => get().watchlistIds.has(movieId),
}));
