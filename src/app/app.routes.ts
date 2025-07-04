import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage';
import { BusinessDashboardComponent } from './pages/business-dashboard/business-dashboard';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent
  },
  {
    path: 'restaurant/:id',
    loadComponent: () => import('./pages/restaurant-detail/restaurant-detail')
      .then(m => m.RestaurantDetailComponent)
  },
  {
  path: 'business-dashboard',
  component: BusinessDashboardComponent
},
  {
    path: '**',
    redirectTo: ''
  }
];
