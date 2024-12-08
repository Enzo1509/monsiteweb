import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Booking, TimeSlot } from '@/types/booking';
import {
  createBooking as dbCreateBooking,
  getBookingsByBusiness,
  getBookingsByUser,
  updateBookingStatus,
  generateTimeSlots,
} from '@/lib/db';

interface BookingState {
  bookings: Booking[];
  selectedDate: string | null;
  selectedTime: string | null;
  loadBusinessBookings: (businessId: string) => Promise<void>;
  loadUserBookings: (userId: string) => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id' | 'status'>) => Promise<Booking>;
  updateStatus: (bookingId: string, status: 'confirmed' | 'cancelled') => Promise<void>;
  getAvailableSlots: (date: string, businessId: string) => TimeSlot[];
  setSelectedDate: (date: string | null) => void;
  setSelectedTime: (time: string | null) => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookings: [],
      selectedDate: null,
      selectedTime: null,

      loadBusinessBookings: async (businessId: string) => {
        const bookings = await getBookingsByBusiness(businessId);
        set({ bookings });
      },

      loadUserBookings: async (userId: string) => {
        const bookings = await getBookingsByUser(userId);
        set({ bookings });
      },

      createBooking: async (booking) => {
        const newBooking = await dbCreateBooking(booking);
        set(state => ({
          bookings: [...state.bookings, newBooking],
          selectedDate: null,
          selectedTime: null,
        }));
        return newBooking;
      },

      updateStatus: async (bookingId: string, status) => {
        await updateBookingStatus(bookingId, status);
        set(state => ({
          bookings: state.bookings.map(b =>
            b.id === bookingId ? { ...b, status } : b
          ),
        }));
      },

      getAvailableSlots: (date: string, businessId: string) => {
        const { bookings } = get();
        const businessBookings = bookings.filter(b => b.businessId === businessId);
        return generateTimeSlots(date, businessBookings);
      },

      setSelectedDate: (date) => set({ selectedDate: date, selectedTime: null }),
      setSelectedTime: (time) => set({ selectedTime: time }),
    }),
    {
      name: 'bookings-storage',
    }
  )
);