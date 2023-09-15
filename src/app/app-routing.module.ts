import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { FormMEDGuard } from './Guards/formmed.guard';
import { FormRNGGuard } from './Guards/formrng.guard';
import { LoginGuard } from './Guards/login.guard';
import { PageGuard } from './Guards/page.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [LoginGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'rionegroform',
    loadChildren: () => import('./Pages/form/form.module').then( m => m.FormPageModule),
    canActivate: [FormRNGGuard]
  },
  {
    path: 'medellinform',
    loadChildren: () => import('./Pages/form-medellin/form-medellin.module').then( m => m.FormMedellinPageModule),
    canActivate: [FormMEDGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./Pages/dashboard/dashboard.module').then( m => m.DashboardPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./Pages/users/users.module').then( m => m.UsersPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'ubicaciones',
    loadChildren: () => import('./Pages/ubicaciones/ubicaciones.module').then( m => m.UbicacionesPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'charts',
    loadChildren: () => import('./Pages/charts/charts.module').then( m => m.ChartsPageModule),
    canActivate: [PageGuard]
  },

  {
    path: 'error',
    loadChildren: () => import('./Pages/error/error.module').then( m => m.ErrorPageModule)
  },
  {
    path: 'session',
    loadChildren: () => import('./Pages/sesiones/sesiones.module').then( m => m.SesionesPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'account',
    loadChildren: () => import('./Pages/account/account.module').then( m => m.AccountPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
