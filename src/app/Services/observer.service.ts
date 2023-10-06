import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
     providedIn: 'root'
})

export class ObserverService {

    logoobs = new BehaviorSubject('/assets/avatar.svg');
    $LogoObs = this.logoobs.asObservable();

    roleInfo = new BehaviorSubject([]);
    $roleInfo = this.roleInfo.asObservable();

    reload = new BehaviorSubject(false);
    $reload = this.reload.asObservable();

     constructor(
        
     ) { }

     
     logo(str) {
        this.logoobs.next(str)
     }

     role(arr) {
          this.roleInfo.next(arr)
     }


     load(arr) {
          this.reload.next(arr)
     }

}
