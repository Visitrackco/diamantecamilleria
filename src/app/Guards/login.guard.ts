import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { StorageWebService } from '../Services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private storage: StorageWebService,
    private router: NavController
  ) { }

  canActivate() {
    return this.storage.getLogin().then(async (data) => {
      console.log('ENYTRANDO AL GUARD', data)
      if (data.length > 0) {

          let work = data[0].WorkZone;
    
          if (work == 6842) {
            this.router.navigateRoot(['/medellinform'])
          }
          if (work == 6993) {
            this.router.navigateRoot(['/rionegroform'])
          }
        

          if (work == 1001) {
            this.router.navigateRoot(['/form-pruebas'])
          }
        


        return false;

      } else {
        return true;
      }
    }).catch(() => {
      this.router.navigateRoot(['/home']);
      console.log('Error en auth/serve-store');
      return true;
    });
  }

}
