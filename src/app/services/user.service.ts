// src/app/services/users.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '@/interfaces/user.model';
import { AuthService } from '@/services/auth.service';
import { environment } from '@/enviroments/enviroment';

//const BASE_URL = 'http://localhost:8085/v1/users';
const BASE_URL = environment.api.reviews+'/v1/users';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private auth = inject(AuthService); // por si quieres armar headers manuales

  /**
   * Lista usuarios con rol CLIENTE
   * @param page default 0
   * @param size default 20
   * @param q    (opcional) búsqueda en nombre/email/dpi
   * @param enabled (opcional) true|false
   */
  listarClientes(params: {
    page?: number; size?: number; q?: string; enabled?: boolean;
  } = {}): Observable<UserDTO[]> {
    let p = new HttpParams()
      .set('rol', 'CLIENTE')
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20));
    if (params.q) p = p.set('q', params.q.trim());
    if (params.enabled !== undefined) p = p.set('enabled', String(params.enabled));

    // Si NO usas interceptor, puedes forzar el header así:
    // const headers = { Authorization: `Bearer ${this.auth.token}` };

    return this.http.get<UserDTO[]>(BASE_URL, { params: p /*, headers*/ });
  }
}