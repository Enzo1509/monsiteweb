import { openDB } from 'idb';
import type { Business } from '@/types/business';
import type { User } from '@/types/auth';
import type { Booking, TimeSlot } from '@/types/booking';

const DB_NAME = 'book-it-db';
const DB_VERSION = 5; // Update version number

let dbInstance: any = null;

export async function initDB() {
  if (dbInstance) return dbInstance;

  try {
    // Delete existing database if version mismatch
    const existingDb = await indexedDB.open(DB_NAME);
    if (existingDb.version < DB_VERSION) {
      await indexedDB.deleteDatabase(DB_NAME);
    }

    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('by-email', 'email', { unique: true });
        }
        if (!db.objectStoreNames.contains('businesses')) {
          db.createObjectStore('businesses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bookings')) {
          db.createObjectStore('bookings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: ['userId', 'businessId'] });
        }
      },
    });

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Business functions
export async function createBusiness(business: Omit<Business, 'id'>): Promise<Business> {
  const db = await initDB();
  const id = crypto.randomUUID();
  const newBusiness = { ...business, id };
  await db.add('businesses', newBusiness);
  return newBusiness;
}

export async function getAllBusinesses(): Promise<Business[]> {
  const db = await initDB();
  return db.getAll('businesses');
}

export async function updateBusiness(id: string, business: Business): Promise<Business> {
  const db = await initDB();
  await db.put('businesses', business);
  return business;
}

export async function deleteBusiness(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('businesses', id);
}

// Booking functions
export async function createBooking(booking: Omit<Booking, 'id' | 'status'>): Promise<Booking> {
  const db = await initDB();
  const id = crypto.randomUUID();
  const newBooking = { ...booking, id, status: 'pending' as const };
  await db.add('bookings', newBooking);
  return newBooking;
}

export async function getBookingsByBusiness(businessId: string): Promise<Booking[]> {
  const db = await initDB();
  const bookings = await db.getAll('bookings');
  return bookings.filter(booking => booking.businessId === businessId);
}

export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  const db = await initDB();
  const bookings = await db.getAll('bookings');
  return bookings.filter(booking => booking.userId === userId);
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled'
): Promise<void> {
  const db = await initDB();
  const booking = await db.get('bookings', bookingId);
  if (booking) {
    booking.status = status;
    await db.put('bookings', booking);
  }
}

// Favorites functions
export async function addToFavorites(userId: string, businessId: string): Promise<void> {
  const db = await initDB();
  await db.put('favorites', { userId, businessId });
}

export async function removeFromFavorites(userId: string, businessId: string): Promise<void> {
  const db = await initDB();
  await db.delete('favorites', [userId, businessId]);
}

export async function getFavorites(userId: string): Promise<Business[]> {
  const db = await initDB();
  const favorites = await db.getAll('favorites');
  const userFavorites = favorites.filter(fav => fav.userId === userId);
  const businesses = await getAllBusinesses();
  return businesses.filter(business => 
    userFavorites.some(fav => fav.businessId === business.id)
  );
}

export async function isFavorite(userId: string, businessId: string): Promise<boolean> {
  const db = await initDB();
  const favorite = await db.get('favorites', [userId, businessId]);
  return !!favorite;
}

// Time slot generation
export function generateTimeSlots(date: string, bookings: Booking[]): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 19;

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minutes of ['00', '30']) {
      const time = `${hour}:${minutes}`;
      const isBooked = bookings.some(
        booking => booking.date === date && booking.time === time
      );

      slots.push({
        id: crypto.randomUUID(),
        date,
        time,
        available: !isBooked,
      });
    }
  }

  return slots;
}