import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IngresosRestResp, PopularHabitacionResp, PopularRestauranteResp } from '@/interfaces/reportes.model';
import { environment } from '@/enviroments/enviroment';

//const BASE_URL = 'http://localhost:8086/v1/reportes';


@Injectable({ providedIn: 'root' })
export class ReportesService {
  
  private http = inject(HttpClient);
  private BASE_URL = environment.api.reportes+'/v1/reportes';

  popularRestaurante(desde?: string, hasta?: string, restauranteId?: string): Observable<PopularRestauranteResp> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (restauranteId) params = params.set('restauranteId', restauranteId);
    return this.http.get<PopularRestauranteResp>(`${this.BASE_URL}/popular/restaurante`, { params });
  }

  popularHabitacion(desde: string, hasta: string, hotelId: string): Observable<PopularHabitacionResp> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta).set('hotelId', hotelId);
    return this.http.get<PopularHabitacionResp>(`${this.BASE_URL}/popular/habitacion`, { params });
  }

  ingresosRestaurante(restauranteId: string, desde?: string, hasta?: string): Observable<IngresosRestResp> {
    let params = new HttpParams().set('restauranteId', restauranteId);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<IngresosRestResp>(`${this.BASE_URL}/ingresos/restaurante`, { params });
  }
}