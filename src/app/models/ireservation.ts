export interface IReservation {
  id: number;
  reservationDate: string;  // "2025-07-04"
  reservationTime: string;  // "19:30"
  numberOfPeople: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  createdAt: string;
  customer: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  restaurant: {
    id: number;
    name: string;
  };
}
