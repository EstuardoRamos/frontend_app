// src/app/services/reviews.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HotelReviewCreateDTO, PlatilloReviewCreateDTO } from '@/interfaces/reviews.interface';

const BASE = 'http://localhost:8084/v1/reviews';


@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(HttpClient);

  crearReviewPlatillo(dto: PlatilloReviewCreateDTO) {
    return this.http.post(`${BASE}/platillos`, dto);
  }
  crearReviewHotel(dto: HotelReviewCreateDTO) {
    return this.http.post(`${BASE}/hotel`, dto);
  }
}