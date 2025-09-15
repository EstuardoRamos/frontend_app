export interface PlatilloReviewCreateDTO {
  cuentaId: string;
  platilloId: string;
  estrellas: number;   // 1-5
  comentario?: string; // opcional
}

export interface ReviewPlatilloDTO {
  id: string;
  cuentaId: string;
  restauranteId: string;
  platilloId: string;
  clienteId: string | null;
  estrellas: number;
  comentario?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface HotelReviewCreateDTO {
  facturaHotelId: string;
  estrellas: number;    // 1-5
  comentario?: string;  // opcional
  tags?: string[];      // opcional
}

// DTOs esperados desde el backend
export interface ReviewHotelDTO {
  id: string;
  facturaHotelId: string | null;
  hotelId: string;
  habitacionId: string | null;
  clienteId: string | null;
  estrellas: number;
  comentario?: string | null;
  tags?: string[] | null;
  enabled: boolean;
  createdAt: string;
}

export interface PromedioHotelResp {
  hotelId: string;
  promedio: number;
  total: number;
}