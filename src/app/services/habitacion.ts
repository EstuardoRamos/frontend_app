import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/enviroments/enviroment';
import { HabitacionCreateDTO, HabitacionDTO, Page } from '@/interfaces/habitacion.model';

@Injectable({ providedIn: 'root' })
export class HabitacionesService {
  private base = environment.api.hoteles + '/v1/habitaciones';

  constructor(private http: HttpClient) {}

  // GET /v1/habitaciones?hotelId=...&page=0&size=20
  listarPorHotel(hotelId: string, page = 0, size = 10): Observable<Page<HabitacionDTO>> {
    const params = new HttpParams()
      .set('hotelId', hotelId)
      .set('page', page)
      .set('size', size);
    return this.http.get<Page<HabitacionDTO>>(this.base, { params });
  }

  // GET /v1/habitaciones/{id}
  detalle(id: string): Observable<HabitacionDTO> {
    return this.http.get<HabitacionDTO>(`${this.base}/${id}`);
  }

  // POST /v1/habitaciones
  crear(dto: HabitacionCreateDTO): Observable<HabitacionDTO> {
    return this.http.post<HabitacionDTO>(this.base, dto);
  }

  // PUT /v1/habitaciones/{id}
  actualizar(id: string, dto: Partial<HabitacionDTO>): Observable<HabitacionDTO> {
    return this.http.put<HabitacionDTO>(`${this.base}/${id}`, dto);
  }

  // DELETE /v1/habitaciones/{id}
  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // PATCH /v1/habitaciones/{id}/estado
  cambiarEstado(id: string, estado: string): Observable<HabitacionDTO> {
    // Ajusta el payload según tu backend (algunos esperan {estado}, otros queryParam)
    return this.http.patch<HabitacionDTO>(`${this.base}/${id}/estado`, { estado });
  }
}