export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  role?: 'admin' | 'professional' | 'user';
  businessId?: string; // ID de l'entreprise pour les professionnels
}