import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const nonAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currUser = authService.getCurrentUser();

  if (currUser?.role === 'admin') {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
