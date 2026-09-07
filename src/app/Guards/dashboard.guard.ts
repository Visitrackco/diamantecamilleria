import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NavController } from '@ionic/angular';
import { PermisosService } from '../Services/permisos.service';
import { ToastService } from '../Services/toast.service';

// Acceso al dashboard de Indicadores. El permiso se asigna por usuario desde
// Control de Usuarios (Users.Dashboard) y viaja en el login guardado en storage.
// Antes de decidir se releen del API (PermisosService): si se los acaban de dar,
// entra sin tener que recargar la pagina. El API valida lo mismo en cada endpoint:
// esto es para que no se entre por URL.
@Injectable({
  providedIn: 'root'
})
export class DashboardGuard implements CanActivate {
  constructor(
    private permisos: PermisosService,
    private router: NavController,
    private toast: ToastService
  ) { }

  canActivate() {
    return this.permisos.refrescar().then((permisos) => {
      if (permisos.Dashboard == 1) {
        return true;
      }

      this.toast.MsgError('No tienes permiso para ver el dashboard de indicadores');
      this.router.navigateRoot(['/dashboard']);
      return false;
    }).catch(() => {
      this.router.navigateRoot(['/home']);
      return false;
    });
  }

}
