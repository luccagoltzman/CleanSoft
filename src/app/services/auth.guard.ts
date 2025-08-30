import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Retorna true se autenticado, senão retorna UrlTree para redirecionar
  return auth.isAuthenticated() ? true : router.parseUrl('/login');
};
