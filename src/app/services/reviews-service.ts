// src/app/services/reviews.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HotelReviewCreateDTO, PlatilloReviewCreateDTO, PromedioHotelResp, ReviewHotelDTO, ReviewPlatilloDTO } from '@/interfaces/reviews.interface';
import { environment } from '@/enviroments/enviroment';

//const BASE = 'http://localhost:8084/v1/reviews';
const BASE = environment.api.reviews+'/v1/reviews';



@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(HttpClient);

  crearReviewPlatillo(dto: PlatilloReviewCreateDTO) {
    return this.http.post(`${BASE}/platillos`, dto);
  }
  crearReviewHotel(dto: HotelReviewCreateDTO) {
    return this.http.post(`${BASE}/hotel`, dto);
  }
  listarReviewsPlatillo(platilloId: string, page = 0, size = 20) {
  const base = BASE+'/platillos';
  const params = new URLSearchParams({ platilloId, page: String(page), size: String(size) }).toString();
  return this.http.get<ReviewPlatilloDTO[]>(`${base}?${params}`);
}
// src/app/services/reviews-service.ts (métodos relevantes)
listarReviewsHotel(hotelId: string, page = 0, size = 100) {
  const url = `${BASE}/hotel?hotelId=${hotelId}&page=${page}&size=${size}`;
  return this.http.get<ReviewHotelDTO[]>(url);
}
promedioHotel(hotelId: string) {
  const url = `${BASE}/hotel/promedio?hotelId=${hotelId}`;
  return this.http.get<PromedioHotelResp>(url);
}
}