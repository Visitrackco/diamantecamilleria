import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { StorageWebService } from '../Services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class PageGuard implements CanActivate {
  constructor(
    private storage: StorageWebService,
    private router: NavController
  ) { }

  canActivate() {
    return this.storage.getLogin().then(async (data) => {
      console.log('ENYTRANDO AL GUARD', data)
      if (data.length > 0) {


        return true;

      } else {
        this.router.navigateRoot(['/home']);
        return false;
      }
    }).catch(() => {
      this.router.navigateRoot(['/home']);
      console.log('Error en auth/serve-store');
      return true;
    });
  }

}
