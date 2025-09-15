// src/app/services/users.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDTO {
    id: string;
    nombre: string;
    email: string;
    dpi: string;
    rol: 'ADMIN' | 'CLIENTE' | 'EMPLEADO_REST' | 'EMPLEADO_HOTEL';
    enabled: boolean;
    createdAt: string;
}

const BASE = 'http://localhost:8085/v1/users';

@Injectable({ providedIn: 'root' })
export class UsersService {
    private http = inject(HttpClient);

    listar(
        opts: {
            q?: string;
            rol?: 'ADMIN' | 'CLIENTE' | 'EMPLEADO_REST' | 'EMPLEADO_HOTEL';
            enabled?: boolean;
            page?: number;
            size?: number;
        } = {}
    ): Observable<UserDTO[]> {
        let params = new HttpParams();
        if (opts.q) params = params.set('q', opts.q);
        if (opts.rol) params = params.set('rol', opts.rol);
        if (typeof opts.enabled === 'boolean') params = params.set('enabled', String(opts.enabled));
        if (typeof opts.page === 'number') params = params.set('page', String(opts.page));
        if (typeof opts.size === 'number') params = params.set('size', String(opts.size));

        // El authInterceptor adjunta el Bearer automáticamente
        return this.http.get<UserDTO[]>(BASE, { params });
    }

    detalle(id: string): Observable<UserDTO> {
        return this.http.get<UserDTO>(`${BASE}/${id}`);
    }
}
