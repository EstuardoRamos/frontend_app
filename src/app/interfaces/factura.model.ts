export interface FacturaItemDTO {
  id: string;
  descripcion: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface FacturaCreateDTO {
  reservaId: string;
  moneda: string;       // ej: 'GTQ'
  serie: string;        // ej: 'A'
  clienteNit: string;   // ej: 'CF' o NIT válido
  clienteNombre: string;
}

export interface FacturaDTO {
  id: string;
  serie: string;
  numero: number;
  hotelId: string;
  reservaId: string;
  moneda: string;
  subtotal: number;
  impuesto: number;
  propina: number;
  total: number;
  estado: string;        // EMITIDA | ANULADA ...
  createdAt: string;     // ISO
  items: FacturaItemDTO[];
}