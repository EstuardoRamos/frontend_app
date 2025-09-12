export interface ReservaCreateDTO {
  hotelId: string;
  habitacionId: string;
  clienteId: string;
  entrada: string;   // 'YYYY-MM-DD'
  salida: string;    // 'YYYY-MM-DD'
  huespedes: number;
}

export interface ReservaDTO extends ReservaCreateDTO {
  id: string;
  estado: string;    // RESERVADA | CHECKED_IN | CHECKED_OUT | CANCELADA ...
  total: number;
}