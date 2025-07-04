import { CanActivateFn } from '@angular/router';

export const businessGuardGuard: CanActivateFn = (route, state) => {
  return true;
};
