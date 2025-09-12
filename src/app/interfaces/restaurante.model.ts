export interface RestauranteCreateDTO {
  hotelId?: string;            // puede venir vacío si no está vinculado
  nombre: string;
  direccion: string;
  impuestoPorc: number;        // 0..100 (o 0..1 si tu API usa fracción; ajusta!)
  propinaPorcDefault: number;  // 0..100
}

export interface RestauranteDTO extends RestauranteCreateDTO {
  id: string;
  enabled: boolean;
}