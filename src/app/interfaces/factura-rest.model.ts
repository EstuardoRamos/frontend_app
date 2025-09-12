// interfaces/factura-rest.model.ts
export interface FacturaItemDTO {
  id: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface FacturaRestDTO {
  id: string;
  serie: string;
  numero: number;
  restauranteId: string;
  cuentaId: string;
  moneda: string;
  subtotal: number;
  impuesto: number;
  propina: number;
  total: number;
  estado: 'EMITIDA' | 'ANULADA';
  createdAt: string;
  items: FacturaItemDTO[];
}

export interface FacturaEmitRestDTO {
  cuentaId: string;
  moneda: string;
  serie: string;
  clienteNit?: string;
  clienteNombre?: string;
}