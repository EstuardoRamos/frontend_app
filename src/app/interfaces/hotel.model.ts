export interface HotelCreateDTO {
  nombre: string;
  estrellas: number;     // 1..5
  pais: string;
  ciudad: string;
  linea1: string;
  linea2?: string;
  codigoPostal?: string;
  checkInDesde: string;  // HH:mm
  checkOutHasta: string; // HH:mm
}

export interface HotelDTO {
  id: string;            // uuid
  nombre: string;
  estrellas: number;
  activo: boolean;
  pais: string;
  ciudad: string;
  linea1: string;
  linea2?: string;
  codigoPostal?: string;
  checkInDesde: string;
  checkOutHasta: string;
}