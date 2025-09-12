// src/app/interfaces/cuenta.model.ts
export type EstadoCuenta = 'ABIERTA' | 'CERRADA' | 'COBRADA';

export interface CuentaDTO {
  id: string;
  restauranteId: string;
  mesa: string;
  estado: EstadoCuenta;
  subtotal: number;
  impuesto: number;
  propina: number;
  total: number;
}

export interface CuentaCreateDTO {
  restauranteId: string;
  mesa: string;
}

export interface ConsumoDTO {
  id: string;
  cuentaId: string;
  platilloId?: string | null;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  nota?: string | null;
}

export interface ConsumoCreateDTO {
  platilloId?: string | null;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  nota?: string | null;
}