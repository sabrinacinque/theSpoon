// Interfacce per il frontend
export interface ISearchFilters {
  city: string;
  cuisine: string;
}

export interface ICategory {
  name: string;
  icon: string;
}

export interface IQuickFilter {
  label: string;
  value: string;
  active: boolean;
}

// Response types per le API
export interface IApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface IRatingResponse {
  averageRating: number;
  atmosfera: number;
  cibo: number;
  servizio: number;
}
