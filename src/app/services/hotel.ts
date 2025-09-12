import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { environment } from '../../../environments/environment';
import { HotelCreateDTO, HotelDTO } from '@/interfaces/hotel.model';
import { environment } from '@/enviroments/enviroment';
//mport { HotelDTO, HotelCreateDTO } from './hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelesService {
  private base = environment.api.hoteles + '/v1/hoteles';

  constructor(private http: HttpClient) {}

  // GET /v1/hoteles
  listar(): Observable<HotelDTO[]> {
    return this.http.get<HotelDTO[]>(this.base);
  }

  // GET /v1/hoteles/{id}
  detalle(id: string): Observable<HotelDTO> {
    return this.http.get<HotelDTO>(`${this.base}/${id}`);
  }

  // POST /v1/hoteles
  crear(dto: HotelCreateDTO): Observable<HotelDTO> {
    return this.http.post<HotelDTO>(this.base, dto);
  }

  // PUT /v1/hoteles/{id}
  actualizar(id: string, dto: Partial<HotelDTO>): Observable<HotelDTO> {
    return this.http.put<HotelDTO>(`${this.base}/${id}`, dto);
  }

  // DELETE /v1/hoteles/{id}
  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}