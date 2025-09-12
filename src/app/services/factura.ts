import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/enviroments/enviroment';
import { FacturaCreateDTO, FacturaDTO } from '@/interfaces/factura.model';

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private base = environment.api.habitaciones + '/v1/facturas'; // corre en 8082 según tu ejemplo

  constructor(private http: HttpClient) {}

  // GET /v1/facturas/hotel?hotelId=...
  listarPorHotel(hotelId: string, desde?: string, hasta?: string): Observable<FacturaDTO[]> {
    let params = new HttpParams().set('hotelId', hotelId);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<FacturaDTO[]>(`${this.base}/hotel`, { params });
  }

  // POST /v1/facturas/hotel (emitir)
  emitir(dto: FacturaCreateDTO): Observable<FacturaDTO> {
    return this.http.post<FacturaDTO>(`${this.base}/hotel`, dto);
  }

  // POST /v1/facturas/hotel/{id}/anular
  anular(id: string): Observable<FacturaDTO> {
    return this.http.post<FacturaDTO>(`${this.base}/hotel/${id}/anular`, {});
  }

  // GET /v1/facturas/hotel/{id}
  detalle(id: string): Observable<FacturaDTO> {
    return this.http.get<FacturaDTO>(`${this.base}/hotel/${id}`);
  }
}