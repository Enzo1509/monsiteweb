import { create } from 'zustand';
import type { Business } from '../types/business';
import { getAllBusinesses, createBusiness as dbCreateBusiness, updateBusiness as dbUpdateBusiness, deleteBusiness as dbDeleteBusiness } from '../lib/db';

interface BusinessState {
  businesses: Business[];
  selectedCity: string | null;
  setSelectedCity: (city: string | null) => void;
  loadBusinesses: () => Promise<void>;
  addBusiness: (business: Omit<Business, 'id' | 'rating' | 'totalReviews' | 'reviews' | 'services'>) => Promise<Business>;
  updateBusiness: (id: string, business: Business) => Promise<Business>;
  deleteBusiness: (id: string) => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set) => ({
  businesses: [],
  selectedCity: null,
  setSelectedCity: (city) => set({ selectedCity: city }),
  
  loadBusinesses: async () => {
    try {
      const businesses = await getAllBusinesses();
      set({ businesses });
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  },
  
  addBusiness: async (business) => {
    try {
      const newBusiness = await dbCreateBusiness(business);
      set(state => ({
        businesses: [...state.businesses, newBusiness],
      }));
      return newBusiness;
    } catch (error) {
      console.error('Failed to add business:', error);
      throw error;
    }
  },
  
  updateBusiness: async (id, business) => {
    try {
      const updatedBusiness = await dbUpdateBusiness(id, business);
      set(state => ({
        businesses: state.businesses.map(b =>
          b.id === id ? updatedBusiness : b
        ),
      }));
      return updatedBusiness;
    } catch (error) {
      console.error('Failed to update business:', error);
      throw error;
    }
  },
  
  deleteBusiness: async (id) => {
    try {
      await dbDeleteBusiness(id);
      set(state => ({
        businesses: state.businesses.filter(b => b.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete business:', error);
      throw error;
    }
  },
}));