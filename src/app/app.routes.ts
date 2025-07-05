import { DashboardCustomer } from './pages/dashboard-customer/dashboard-customer';
import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage';
import { BusinessDashboardComponent } from './pages/business-dashboard/business-dashboard';

// Import dei Guards
import { customerGuardGuard } from './guards/customer-guard-guard';
import { businessGuardGuard } from './guards/business-guard-guard';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    canActivate: [customerGuardGuard]  // 🛡️ Blocca Business dalla homepage
  },
  {
    path: 'restaurant/:id',
    loadComponent: () => import('./pages/restaurant-detail/restaurant-detail')
      .then(m => m.RestaurantDetailComponent),
    canActivate: [customerGuardGuard]  // 🛡️ Anche restaurant-detail solo per Customer/Guest
  },
  {
    path: 'business-dashboard',
    component: BusinessDashboardComponent,
    canActivate: [businessGuardGuard]  // 🛡️ Solo Business può accedere
  },
  {
    path: 'dashboard-customer',
    component: DashboardCustomer,
    canActivate: [customerGuardGuard]  // 🛡️ Solo Business può accedere
  },
  {
    path: '**',
    redirectTo: ''
  }
];
