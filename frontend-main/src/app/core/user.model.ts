
export interface User {
  _id : string;
  name : string;
  email : string;
  phone : string;
  passwordHash : string;
  role: 'customer' | 'admin';
  loyaltyAccountId : string | null;
  isActive : boolean;
}
