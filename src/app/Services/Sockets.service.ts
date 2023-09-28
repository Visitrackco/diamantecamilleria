




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

                console.log(data)
                
                obs.next(data);
            })
        })

        return notificaciones;
    }

    alert() {

        const notificaciones = new Observable((obs) => {
            this.socket.on('alert', (data) => {

                console.log(data)
                
            
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

    deleteSolicitud(data) {
        this.socket.emit('deleteSolicitud', data)
    }


    connect() {
        this.socket.connect()
    }


    
    
     async initUser()  {
        try {
          const user = await this.stg.get('login')
    
          if (user.length > 0) {
       
            this.socket.emit('initUser', {_id: user[0]['_id']});
          }
        } catch (e) {}
      }


      async exitUser(user)  {
        try {
     
    
          if (user) {
       
            this.socket.emit('exitUser', {_id: user[0]['_id']});
          }
        } catch (e) {}
      }


      async connectEmit()  {
        try {
          const user = await this.stg.get('login')
    
          if (user.length > 0) {
            user[0].UserID = user[0]._id
            this.socket.emit('connectuser', {user: user[0], WorkZoneID: user[0].WorkZone, title: 'Nueva Conexión', msg: 'El usuario ' + user[0].FirstName + ' ' + user[0].LastName + '  se conectó de camilleria'});
          }
        } catch (e) {}
      }



      async disconnectEmit(user)  {
        try {
      
          if (user) {
            this.socket.emit('disconnectuser', {user: user[0], WorkZoneID: user[0].WorkZone, title: 'Desconexión', msg: 'El usuario ' + user[0].FirstName + ' ' + user[0].LastName + '  se desconectó de camilleria'});
          }
        } catch (e) {}
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




    lockEmit(data) {
        this.socket.emit('lock', (data))
       // this.socket.disconnect()
    }





    disconnect(WorkZoneID) {
        this.socket.emit('exitHospital', ({
            WorkZoneID
        }))
       // this.socket.disconnect()
    }




}



