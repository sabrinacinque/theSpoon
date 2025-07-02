export interface IReview {
  id: number;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  overallRating: number;
  ratingAtmosfera: number;
  ratingCibo: number;
  ratingServizio: number;
  comment: string;
  reviewDate: string;
  mealType: string;
  numeroPersone: number;
}
