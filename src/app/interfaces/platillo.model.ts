// src/app/interfaces/platillo.model.ts
export interface PlatilloDTO {
  id: string;
  restauranteId: string | null;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string | null;
  disponible: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatilloCreateDTO {
  restauranteId: string | null;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string | null;
  disponible: boolean;
}