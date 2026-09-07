import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

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

    // Cambio de clinica desde el perfil. Es un Subject (no BehaviorSubject) porque es
    // un evento: las pantallas que se crean despues ya leen la zona del storage y no
    // deben recibir un cambio viejo al suscribirse.
    zona = new Subject<number>();
    $zona = this.zona.asObservable();

    // Permisos del dashboard releidos del API (PermisosService). El menu lateral los
    // escucha para mostrar u ocultar Indicadores sin que haya que recargar la pagina.
    permisos = new BehaviorSubject(null);
    $permisos = this.permisos.asObservable();

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

     cambioZona(WorkZoneID: number) {
          this.zona.next(WorkZoneID)
     }

     permisosDashboard(data) {
          this.permisos.next(data)
     }

}
