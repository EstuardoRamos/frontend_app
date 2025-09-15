export interface PopularRestauranteResp {
  desde: string; hasta: string; restauranteIdFiltro?: string;
  top: { restauranteId: string; ingresos: number; facturas: number };
  ranking: { restauranteId: string; ingresos: number }[];
  facturas: {
    id: string; restauranteId: string; cuentaId: string; clienteId: string | null;
    createdAt: string; subtotal: number; impuesto: number; propina: number; total: number; estado: string;
  }[];
}

export interface PopularHabitacionResp {
  desde: string; hasta: string; hotelId: string;
  top: { habitacionId: string; hotelId: string; alojamientos: number };
  ranking: { habitacionId: string; alojamientos: number }[];
  reservas: {
    id: string; hotelId: string; habitacionId: string; clienteId: string;
    entrada: string; salida: string; huespedes: number; estado: string | null; total: number;
  }[];
}

export interface IngresosRestResp {
  restauranteId: string;
  desde?: string; hasta?: string;
  total: number;
  facturas: {
    id: string; restauranteId: string; cuentaId: string; clienteId: string | null;
    createdAt: string; subtotal: number; impuesto: number; propina: number; total: number; estado: string;
  }[];
}


// src/app/interfaces/reportes.model.ts
export interface FacturaMin {
  id: string; restauranteId: string; cuentaId: string; clienteId?: string | null;
  createdAt: string; subtotal: number; impuesto: number; propina: number; total: number; estado: string;
}
export interface ReservaMin {
  id: string; hotelId: string; habitacionId: string; clienteId: string;
  entrada: string; salida: string; huespedes: number; estado: string | null; total: number;
}

export interface PopularRestauranteReport {
  desde: string; hasta: string; restauranteIdFiltro?: string | null;
  top: { restauranteId: string; ingresos: number; facturas: number } | null;
  ranking: { restauranteId: string; ingresos: number }[];
  facturas: FacturaMin[];
}
export interface PopularHabitacionReport {
  desde: string; hasta: string; hotelId: string;
  top: { habitacionId: string; hotelId: string; alojamientos: number } | null;
  ranking: { habitacionId: string; alojamientos: number }[];
  reservas: ReservaMin[];
}
export interface IngresosRestauranteReport {
  restauranteId: string; desde?: string; hasta?: string; total: number; facturas: FacturaMin[];
}