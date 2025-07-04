import { CanActivateFn } from '@angular/router';

export const customerGuardGuard: CanActivateFn = (route, state) => {
  return true;
};
