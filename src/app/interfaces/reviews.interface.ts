export interface PlatilloReviewCreateDTO {
  cuentaId: string;
  platilloId: string;
  estrellas: number;   // 1-5
  comentario?: string; // opcional
}
export interface HotelReviewCreateDTO {
  facturaHotelId: string;
  estrellas: number;    // 1-5
  comentario?: string;  // opcional
  tags?: string[];      // opcional
}