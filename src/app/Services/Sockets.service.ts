




import { Injectable } from '@angular/core';
import { Router } from '@angular/router';


import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { StorageWebService } from './storage.service';
import { ToastService } from './toast.service';


@Injectable({
    providedIn: 'root'
})


export class SocketService {
    constructor(
        private loadingc: LoadingController,
        private toast: ToastService,
        private stg: Storage,
        private router: Router,
        private socket: Socket
    ) { }




    evento() {

        const notificaciones = new Observable((obs) => {
            this.socket.on('envio', (data) => {
                console.log('mala', data)
                obs.next(data);
            })
        })

        return notificaciones;
    }

}



