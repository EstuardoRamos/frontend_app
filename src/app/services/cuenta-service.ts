// src/app/services/cuentas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CuentaCreateDTO, CuentaDTO, ConsumoCreateDTO, ConsumoDTO } from '@/interfaces/cuenta.model';
import { environment } from '@/enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class CuentasService {
  private base = environment.api.restaurantes+'/v1/cuentas';

  constructor(private http: HttpClient) {}

  // Listar cuentas (opcional: restauranteId)
  listar(restauranteId?: string): Observable<CuentaDTO[]> {
    let params = new HttpParams();
    if (restauranteId) params = params.set('restauranteId', restauranteId);
    return this.http.get<CuentaDTO[]>(this.base, { params });
  }

  abrir(dto: CuentaCreateDTO): Observable<CuentaDTO> {
    return this.http.post<CuentaDTO>(this.base, dto);
  }

  obtener(id: string): Observable<CuentaDTO> {
    return this.http.get<CuentaDTO>(`${this.base}/${id}`);
  }

  cerrar(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/cerrar`, {});
  }

  cobrar(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/cobrar`, {});
  }

  // Consumos
  listarConsumos(cuentaId: string): Observable<ConsumoDTO[]> {
    return this.http.get<ConsumoDTO[]>(`${this.base}/${cuentaId}/consumos`);
  }

  crearConsumo(cuentaId: string, dto: ConsumoCreateDTO): Observable<ConsumoDTO> {
    return this.http.post<ConsumoDTO>(`${this.base}/${cuentaId}/consumos`, dto);
  }

  obtenerConsumo(id: string): Observable<ConsumoDTO> {
    return this.http.get<ConsumoDTO>(`/v1/consumos/${id}`);
  }

  actualizarConsumo(id: string, patch: Partial<ConsumoCreateDTO>): Observable<ConsumoDTO> {
    return this.http.put<ConsumoDTO>(`/v1/consumos/${id}`, patch);
  }

  eliminarConsumo(id: string): Observable<void> {
    return this.http.delete<void>(`/v1/consumos/${id}`);
  }
}