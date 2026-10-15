import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NavController } from '@ionic/angular';
import { PermisosService } from '../Services/permisos.service';
import { ToastService } from '../Services/toast.service';

// Modulo Super Admin (crear usuarios y administrar roles). El flag es por usuario
// (Users.SuperAdmin) y se relee del API antes de decidir, igual que el dashboard.
// El API exige lo mismo en cada endpoint: esto es para que no se entre por URL.
@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  constructor(
    private permisos: PermisosService,
    private router: NavController,
    private toast: ToastService
  ) { }

  canActivate() {
    return this.permisos.refrescar().then((permisos) => {
      if (permisos.SuperAdmin === true) {
        return true;
      }

      this.toast.MsgError('Solo un super administrador puede entrar a este módulo');
      this.router.navigateRoot(['/control']);
      return false;
    }).catch(() => {
      this.router.navigateRoot(['/home']);
      return false;
    });
  }

}
