import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/enviroments/enviroment';
import { ReservaCreateDTO, ReservaDTO } from '@/interfaces/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private base = environment.api.habitaciones + '/v1/reservas'; // según tu ejemplo, corre en 8082

  constructor(private http: HttpClient) {}

  // GET /v1/reservas?hotelId=...&page=0&size=20  (tu backend devuelve array)
  listarPorHotel(hotelId: string, page = 0, size = 20): Observable<ReservaDTO[]> {
    const params = new HttpParams().set('hotelId', hotelId).set('page', page).set('size', size);
    return this.http.get<ReservaDTO[]>(this.base, { params });
  }

  detalle(id: string): Observable<ReservaDTO> {
    return this.http.get<ReservaDTO>(`${this.base}/${id}`);
  }

  crear(dto: ReservaCreateDTO): Observable<ReservaDTO> {
    return this.http.post<ReservaDTO>(this.base, dto);
  }

  actualizar(id: string, dto: Partial<ReservaDTO>): Observable<ReservaDTO> {
    return this.http.put<ReservaDTO>(`${this.base}/${id}`, dto);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  checkin(id: string): Observable<ReservaDTO> {
    return this.http.post<ReservaDTO>(`${this.base}/${id}/checkin`, {});
  }

  checkout(id: string): Observable<ReservaDTO> {
    return this.http.post<ReservaDTO>(`${this.base}/${id}/checkout`, {});
  }

  cancelar(id: string): Observable<ReservaDTO> {
    return this.http.patch<ReservaDTO>(`${this.base}/${id}/cancelar`, {});
  }
}