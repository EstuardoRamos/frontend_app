export interface HabitacionCreateDTO {
  hotelId: string;
  numero: string;
  tipo: string;        // STANDARD | DELUXE | SUITE | ...
  capacidad: number;
  precioBase: number;
  descripcion?: string;
}

export interface HabitacionDTO {
  id: string;
  hotelId: string;
  numero: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  precioBase: number;
  estado: string;      // DISPONIBLE | OCUPADA | MANTENIMIENTO | ...
  descripcion?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;       // page index
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}