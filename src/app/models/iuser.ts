export interface IUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'BUSINESS' | 'ADMIN';
}
