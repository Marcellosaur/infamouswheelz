import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Bike {
  id: number;
  seller_id: number;
  title: string;
  brand: string;
  price: number;
  year: number;
  engine_size?: string;
  condition: 'New' | 'Used';
  description?: string;
  status: 'Available' | 'Sold';
  image_url?: string;
}

export interface FavoriteBike {
  id: number;
  motorcycle_id: number;
  user_id: number;
  created_at: string;
  title: string;
  brand: string;
  year: number;
  price: number;
  image_url?: string;
  condition: 'New' | 'Used';
  status: 'Available' | 'Sold';
}

export interface Inquiry {
  id: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  motorcycle_id: number;
  motorcycle_title: string;
  motorcycle_brand: string;
  motorcycle_year: number;
  seller_name: string;
}

export interface SellerInquiry {
  id: number;
  message: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  motorcycle_id: number;
  motorcycle_title: string;
  motorcycle_price: number;
  motorcycle_image?: string;
  buyer_id: number;
  buyer_name: string;
  buyer_since: string;
}

export interface Seller {
  id: number;
  name: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class BikesService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(conditions?: string[]): Observable<Bike[]> {
    const params: any = {};
    if (conditions?.length) {
      params.condition = conditions.join(',');
    }
    return this.http.get<Bike[]>(`${this.api}/bikes`, { params });
  }

  getById(id: number): Observable<Bike> {
    return this.http.get<Bike>(`${this.api}/bikes/${id}`);
  }

  getAllWithFilters(filters: {minPrice?: number; maxPrice?: number; conditions?: string[] }) {
    const params: any = {};
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    if (filters.conditions?.length) params.condition = filters.conditions.join(',');

    return this.http.get<Bike[]>(`${this.api}/bikes`, { params });
  }

  getFavorites(): Observable<FavoriteBike[]> {
  return this.http.get<FavoriteBike[]>(`${this.api}/favorites`);
}

  getInquiries(): Observable<Inquiry[]> {
    return this.http.get<Inquiry[]>(`${this.api}/inquiries`);
  }

  getSellerInquiries(): Observable<SellerInquiry[]> {
    return this.http.get<SellerInquiry[]>(`${this.api}/inquiries/seller`);
  }

  updateInquiryStatus(inquiryId: number, status: 'Approved' | 'Rejected'): Observable<any> {
    return this.http.put(`${this.api}/inquiries/${inquiryId}/status`, { status });
  }

  postInquiry(motorcycle_id: number, message: string): Observable<any> {
    return this.http.post(`${this.api}/inquiries`, { motorcycle_id, message });
  }

toggleFavorite(bikeId: number): Observable<{ message: string; favorited: boolean }> {
  return this.http.post<{ message: string; favorited: boolean }>(
    `${this.api}/favorites/${bikeId}`,
    {}
  );
}

  getSellerById(sellerId: number): Observable<Seller> {
    return this.http.get<Seller>(`${this.api}/users/${sellerId}`);
  }

}
