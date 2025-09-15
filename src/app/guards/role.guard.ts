// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '@/services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si no hay token, deja que authGuard redirija; aquí asumimos que authGuard ya corrió antes.
  const allowed = (route.data?.['roles'] as string[] | undefined) ?? [];
  if (!allowed.length) return true; // si no se definieron roles, pasa

  if (auth.hasRole(...allowed)) return true;

  // Sin permiso → a "Access Denied" (o login si prefieres)
  router.navigate(['/auth/access']);
  return false;
};