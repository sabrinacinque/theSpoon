import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    title: 'TheSpoon - Prenota i migliori ristoranti d\'Italia'
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  // Rotte future che aggiungeremo
  // {
  //   path: 'login',
  //   component: LoginComponent,
  //   title: 'TheSpoon - Accedi'
  // },
  // {
  //   path: 'restaurant/:id',
  //   component: RestaurantDetailComponent,
  //   title: 'TheSpoon - Dettagli Ristorante'
  // },
  {
    path: '**',
    redirectTo: ''
  }
];
