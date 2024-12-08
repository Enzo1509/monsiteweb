import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types/auth';
import {
  createUser,
  getUserByEmail,
  getAllUsers,
  updateUser as updateUserInDb,
  deleteUser as deleteUserFromDb,
  hashPassword,
  verifyPassword,
  validateAdminCredentials,
  checkLoginAttempts,
  resetLoginAttempts,
} from '@/lib/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  loadUsers: () => Promise<void>;
  login: (email: string, password: string, role?: 'admin' | 'professional' | 'user') => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithApple: (token: string) => Promise<void>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      users: [],

      loadUsers: async () => {
        const users = await getAllUsers();
        set({ users });
      },

      login: async (email: string, password: string, role?: 'admin' | 'professional' | 'user') => {
        if (!checkLoginAttempts(email)) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        try {
          if (role === 'admin') {
            const isValid = await validateAdminCredentials(email, password);
            if (!isValid) {
              throw new Error('Invalid credentials');
            }

            set({
              isAuthenticated: true,
              user: {
                id: 'admin',
                email,
                role: 'admin',
                name: 'Administrator',
              },
            });
            resetLoginAttempts(email);
            return;
          }

          const user = await getUserByEmail(email);
          if (!user) {
            throw new Error('Invalid credentials');
          }

          if (role && user.role !== role) {
            throw new Error('Invalid credentials');
          }

          const isValid = await verifyPassword(password, user.password!);
          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          const { password: _, ...userWithoutPassword } = user;
          set({
            isAuthenticated: true,
            user: userWithoutPassword,
          });
          resetLoginAttempts(email);
        } catch (error) {
          throw new Error('Invalid credentials');
        }
      },

      register: async (email: string, password: string, name?: string) => {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
          throw new Error('Email already exists');
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await createUser({
          email,
          name,
          password: hashedPassword,
          role: 'user',
        });

        const { password: _, ...userWithoutPassword } = newUser;
        set(state => ({
          users: [...state.users, newUser],
          isAuthenticated: true,
          user: userWithoutPassword,
        }));
      },

      loginWithGoogle: async (credential: string) => {
        const decoded = jwtDecode(credential);
        let user = await getUserByEmail(decoded.email as string);

        if (!user) {
          user = await createUser({
            email: decoded.email as string,
            name: decoded.name as string,
            picture: decoded.picture as string,
            role: 'user',
          });
        }

        set({
          isAuthenticated: true,
          user,
          users: [...get().users, user],
        });
      },

      loginWithApple: async (token: string) => {
        throw new Error('Apple login not implemented yet');
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
      },

      addUser: async (userData) => {
        const newUser = await createUser(userData);
        set(state => ({
          users: [...state.users, newUser],
        }));
        return newUser;
      },

      updateUser: async (userId, updates) => {
        await updateUserInDb(userId, updates);
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, ...updates } : user
          ),
        }));
      },

      deleteUser: async (userId) => {
        await deleteUserFromDb(userId);
        set(state => ({
          users: state.users.filter(user => user.id !== userId),
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);