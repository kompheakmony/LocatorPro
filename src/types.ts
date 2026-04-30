export type Category = 'Branch' | '24/7' | 'ATM';

export interface Location {
  id: string;
  name: string;
  address: string;
  category: Category;
  lat: number;
  lng: number;
  photo: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
}
