// services/facturas-rest.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacturaEmitRestDTO, FacturaRestDTO } from '@/interfaces/factura-rest.model';
import { environment } from '@/enviroments/enviroment';
  
@Injectable({ providedIn: 'root' })
export class FacturasRestService {
  private base =environment.api.restaurantes+ '/v1/facturas/restaurantes';

  constructor(private http: HttpClient) {}

  emitir(dto: FacturaEmitRestDTO): Observable<FacturaRestDTO> {
    return this.http.post<FacturaRestDTO>(this.base, dto);
  }

  obtener(id: string): Observable<FacturaRestDTO> {
    return this.http.get<FacturaRestDTO>(`${this.base}/${id}`);
  }

  anular(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/anular`, {});
  }

  listar(restauranteId: string, desde?: string, hasta?: string): Observable<FacturaRestDTO[]> {
    let params = new HttpParams().set('restauranteId', restauranteId);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<FacturaRestDTO[]>(this.base, { params });
  }
}