export type Rol = 'ADMIN' | 'CLIENTE' | 'EMPLEADO_REST' | 'EMPLEADO_HOTEL';

export interface JwtClaims {
    sub: string;
    email: string;
    rol: Rol;
    iat: number;
    exp: number;
}
export interface RegisterDTO {
    nombre: string;
    email: string;
    password: string;
    dpi: string;
    rol: Rol;
}

export interface UserDTO {
    id: string;
    nombre: string;
    email: string;
    dpi: string;
    rol: Rol;
    enabled: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
}
