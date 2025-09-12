// src/app/services/platillos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlatilloCreateDTO, PlatilloDTO } from '@/interfaces/platillo.model';
import { environment } from '@/enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class PlatillosService {
  private base = environment.api.restaurantes+'/v1/platillos';

  constructor(private http: HttpClient) {}

  // GET /v1/platillos  (opcionalmente con restauranteId)
  // platillos.service.ts
listarTodos(restauranteId?: string | null) {
  let params = new HttpParams();
  if (restauranteId && restauranteId !== 'ALL') {
    params = params.set('restauranteId', restauranteId);
  }
  console.log(this.http.get<PlatilloDTO[]>(this.base, { params }));
  
  return this.http.get<PlatilloDTO[]>(this.base, { params });
}

  // Atajo si prefieres método explícito
  listarPorRestaurante(restauranteId: string): Observable<PlatilloDTO[]> {
    return this.listarTodos(restauranteId);
  }

  // POST /v1/platillos
  crear(dto: PlatilloCreateDTO): Observable<PlatilloDTO> {
    return this.http.post<PlatilloDTO>(this.base, dto);
  }

  // PUT /v1/platillos/{id}
  actualizar(id: string, patch: Partial<PlatilloCreateDTO>): Observable<PlatilloDTO> {
    return this.http.put<PlatilloDTO>(`${this.base}/${id}`, patch);
  }

  // DELETE /v1/platillos/{id} (deshabilitar lógico)
  deshabilitar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}