import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage';

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
    path: '**',
    redirectTo: ''
  }
];
