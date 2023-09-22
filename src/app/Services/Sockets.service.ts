




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




    newActivityOn() {

        const notificaciones = new Observable((obs) => {
            this.socket.on('notification', (data) => {
                
                obs.next(data);
            })
        })

        return notificaciones;
    }

    alert() {

        const notificaciones = new Observable((obs) => {
            this.socket.on('alert', (data) => {
            
                obs.next(data);
            })
        })

        return notificaciones;
    }

    reconnectHospital() {

        const notificaciones = new Observable((obs) => {
            this.socket.on('hospitalCentral', (data) => {
              
                obs.next(data);
            })
        })

        return notificaciones;
    }




    hospitalCentral(WorkZoneID) {
        this.socket.emit('hospitalCentral', {
            WorkZoneID
        })
    }

    newActivity(WorkZoneID, data) {
        this.socket.emit('newActivity', {
            WorkZoneID,
            data
        })
    }

    connect() {
        this.socket.connect()
    }



    connectuser() {

        const conenctions = new Observable((obs) => {
            this.socket.on('connectuser', (data) => {
                console.log('mala', data)
                obs.next(data);
            })
        })

        return conenctions;
    }

    disconnectuser() {

        const conenctions = new Observable((obs) => {
            this.socket.on('disconnectuser', (data) => {
                console.log('mala', data)
                obs.next(data);
            })
        })

        return conenctions;
    }









    disconnect(WorkZoneID) {
        this.socket.emit('exitHospital', ({
            WorkZoneID
        }))
       // this.socket.disconnect()
    }




}



