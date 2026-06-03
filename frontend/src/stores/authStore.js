import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAdmin: false,
      plan: null,
      selectedPlanForCheckout: null,
      isAuthModalOpen: false,
      authModalView: 'login',

      openAuthModal: (view = 'login') => set({ isAuthModalOpen: true, authModalView: view }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setSelectedPlanForCheckout: (plan) => set({ selectedPlanForCheckout: plan }),
      clearSelectedPlanForCheckout: () => set({ selectedPlanForCheckout: null }),

      login: (userData, access, refresh) => {
        set({
          user: userData,
          accessToken: access,
          refreshToken: refresh,
          isAdmin: userData?.is_admin || false,
          plan: {
            name: userData?.plan_name || 'Gratuito',
            id: userData?.plan_id || 1,
          },
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAdmin: false,
          plan: null,
          selectedPlanForCheckout: null,
        });
        localStorage.removeItem('streamflix-auth');
      },

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
      },

      updateUser: (userData) => {
        set({
          user: { ...get().user, ...userData },
          isAdmin: userData?.is_admin ?? get().isAdmin,
          plan: userData?.plan_name
            ? { name: userData.plan_name, id: userData.plan_id }
            : get().plan,
        });
      },
    }),
    {
      name: 'streamflix-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAdmin: state.isAdmin,
        plan: state.plan,
        selectedPlanForCheckout: state.selectedPlanForCheckout,
      }),
    }
  )
);
