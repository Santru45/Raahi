export interface Reviewwithname extends Review {
  name: string;
  _id?: string;
}
export interface Subratings {
  cleanliness: number;
  service: number;
  location: number;
  food: number;
  facilities: number;
  staff: number;
}
export interface Review {
  id?: string;
  _id?: string;
  userId: string;
  entityId: string;
  entityType: string;
  rating: number;
  images?: string[];
  comment: string;
  year: number;
  isVerified: boolean;
  createdAt: string;
  subrating: Subratings;
}
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'customer' | 'admin';
  loyaltyAccountId: string;
  isActive: boolean;
}
