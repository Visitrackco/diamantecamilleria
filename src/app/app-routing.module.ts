import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { FormMEDGuard } from './Guards/formmed.guard';
import { FormRNGGuard } from './Guards/formrng.guard';
import { LoginGuard } from './Guards/login.guard';
import { PageGuard } from './Guards/page.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [LoginGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'rionegroform',
    loadChildren: () => import('./Pages/form/form.module').then(m => m.FormPageModule),
    canActivate: [FormRNGGuard]
  },
  {
    path: 'medellinform',
    loadChildren: () => import('./Pages/form-medellin/form-medellin.module').then(m => m.FormMedellinPageModule),
    canActivate: [FormMEDGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./Pages/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./Pages/users/users.module').then(m => m.UsersPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'ubicaciones',
    loadChildren: () => import('./Pages/ubicaciones/ubicaciones.module').then(m => m.UbicacionesPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'charts',
    loadChildren: () => import('./Pages/charts/charts.module').then(m => m.ChartsPageModule),
    canActivate: [PageGuard]
  },

  {
    path: 'error',
    loadChildren: () => import('./Pages/error/error.module').then(m => m.ErrorPageModule)
  },
  {
    path: 'session',
    loadChildren: () => import('./Pages/sesiones/sesiones.module').then(m => m.SesionesPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'account',
    loadChildren: () => import('./Pages/account/account.module').then(m => m.AccountPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'control',
    loadChildren: () => import('./Pages/control/usuarios.module').then(m => m.UsuariosPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'historial/:id/:name',
    loadChildren: () => import('./Pages/historial/historial.module').then(m => m.HistorialPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'motivos',
    loadChildren: () => import('./Pages/motivos/motivos.module').then(m => m.MotivosPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'motivos-form',
    loadChildren: () => import('./Pages/motivos-form/motivos-form.module').then(m => m.MotivosFormPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'recursos',
    loadChildren: () => import('./Pages/recursos/recursos.module').then(m => m.RecursosPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'tabla',
    loadChildren: () => import('./Pages/Reportes/tabla/tabla.module').then(m => m.TablaPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'reporte-formularios',
    loadChildren: () => import('./Pages/Reportes/formularios/formularios.module').then(m => m.FormulariosPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'perfiles',
    loadChildren: () => import('./Pages/perfiles/perfiles.module').then(m => m.PerfilesPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'form-pruebas',
    loadChildren: () => import('./Pages/form-pruebas/form-pruebas.module').then(m => m.FormPruebasPageModule)
  },
  {
    path: 'privacidad',
    loadChildren: () => import('./privacidad/privacidad.module').then(m => m.PrivacidadPageModule)
  },
  {
    path: 'descansos',
    loadChildren: () => import('./Pages/descansos/descansos.module').then(m => m.DescansosPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'custom-options',
    loadChildren: () => import('./Pages/custom-options/custom-options.module').then( m => m.CustomOptionsPageModule)
  },
  {
    path: 'configuracion',
    loadChildren: () => import('./Pages/configuracion/configuracion.module').then(m => m.ConfiguracionPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'programadas',
    loadChildren: () => import('./Pages/programadas/programadas.module').then(m => m.ProgramadasPageModule),
    canActivate: [PageGuard]
  },
  {
    path: 'indicadores',
    loadChildren: () => import('./Pages/indicadores/indicadores.module').then(m => m.IndicadoresPageModule),
    canActivate: [PageGuard]
  },
  {
    // Vista pública de solo lectura de un tablero compartido (sin guard, sin login)
    path: 'ver/:token',
    loadChildren: () => import('./Pages/publico/publico.module').then(m => m.PublicoPageModule)
  },
  {
    // Administración de links compartidos (solo personal con todos los permisos)
    path: 'links',
    loadChildren: () => import('./Pages/links/links.module').then(m => m.LinksPageModule),
    canActivate: [PageGuard]
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
