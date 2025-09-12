import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/enviroments/enviroment';
import { RestauranteCreateDTO, RestauranteDTO } from '@/interfaces/restaurante.model';

@Injectable({ providedIn: 'root' })
export class RestaurantesService {
    private base = environment.api.restaurantes + '/v1/restaurantes'; // 8083

    constructor(private http: HttpClient) {}

    // GET /v1/restaurantes   →  RestauranteDTO[]
    listarTodos(): Observable<RestauranteDTO[]> {
        return this.http.get<RestauranteDTO[]>(this.base);
    }

    // GET /v1/restaurantes?hotelId=...&page=0&size=20   →  RestauranteDTO[] (tu API devuelve array)
    listarPorHotel(hotelId: string, page = 0, size = 50): Observable<RestauranteDTO[]> {
        const params = new HttpParams().set('hotelId', hotelId).set('page', page).set('size', size);
        return this.http.get<RestauranteDTO[]>(this.base, { params });
    }

    detalle(id: string) {
        return this.http.get<RestauranteDTO>(`${this.base}/${id}`);
    }
    crear(dto: RestauranteCreateDTO) {
        return this.http.post<RestauranteDTO>(this.base, dto);
    }
    actualizar(id: string, dto: Partial<RestauranteDTO>) {
        return this.http.put<RestauranteDTO>(`${this.base}/${id}`, dto);
    }
    deshabilitar(id: string) {
        return this.http.delete<void>(`${this.base}/${id}`);
    }
    vincularHotel(id: string, hotelId: string) {
        return this.http.patch<RestauranteDTO>(`${this.base}/${id}/hotel`, { hotelId });
    }
    desvincularHotel(id: string) {
        return this.http.delete<void>(`${this.base}/${id}/hotel`);
    }
    // restaurantes.service.ts
    habilitar(id: string) {
        return this.http.patch<void>(`${this.base}/${id}/habilitar`, {});
    }
}
