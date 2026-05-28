import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currUser = authService.getCurrentUser();

  if (currUser !== null && currUser.role === 'admin') return true;
  return router.createUrlTree(['/profile']);
};
