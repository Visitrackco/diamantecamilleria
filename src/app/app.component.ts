
import { Component } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { StorageWebService } from './Services/storage.service';
import { ObserverService } from './Services/observer.service';
import { Socket } from 'ngx-socket-io';

import { environment } from "../environments/environment";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { ToastService } from './Services/toast.service';
import { SocketService } from './Services/Sockets.service';
import { ApiService } from './Services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  role;

  title = 'af-notification';
  message: any = null;

  constructor(
    private platform: Platform,
    private storage: Storage,
    private router: Router,
    private menuCtrl: MenuController,
    private stg: StorageWebService,
    private obs: ObserverService,
    private socket: Socket,
    private toast: ToastService,
    private socketService: SocketService,
    private api: ApiService

  ) {

    this.initializeApp();

    this.obs.$roleInfo.subscribe((data) => {
      if (data.length > 0) {
        this.role = data[0];

      }
    })

    this.socketService.reconnectHospital().subscribe(async (data) => {
      if (data) {
        const login = await this.stg.getLogin();
        if (login.length > 0) {
          console.log('RECONNECT', login[0].WorkZone)
          if (login[0].isCentral == 1) {
            this.socketService.hospitalCentral((login[0].WorkZone + 'central').toString())
          }
          if (login[0].isCentralAdmin == 1) {
            this.socketService.hospitalCentral((login[0].WorkZone + 'centraladmin').toString())
          }

        }

      }
    })

    this.socketService.alert().subscribe(async (data: any) => {
      if (data) {
      
        this.toast.notification(data.title, data.message)

      }
    })

  }


  ngOnInit(): void {
    this.requestPermission();
    this.listen();
  }
  requestPermission() {
    const messaging = getMessaging();
    getToken(messaging,
      { vapidKey: environment.configFirebase.vapidkey }).then(
        (currentToken) => {
          if (currentToken) {
            this.storage.set('tokenweb', currentToken);
          } else {
            this.toast.MsgError('No se generò el token, por favor acepte los permisos de notificaciones en su navegador')
          }
        }).catch((err) => {

          this.toast.MsgError('Error mientras se genera el token web ' + err)
        });
  }
  listen() {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {

  

      this.toast.notification(payload.notification.title, payload.notification.body)

      this.message = payload;
    });
  }

  async dataRole() {
    const login = await this.stg.getLogin();

    if (login.length > 0) {
      this.role = login[0].infoRole[0];


    /*  if (login[0].isCentral == 1) {



        if (login[0].isCentral == 1) {
          this.socketService.hospitalCentral(login[0].WorkZone + 'central')
        }
        if (login[0].isCentralAdmin == 1) {
          this.socketService.hospitalCentral(login[0].WorkZone + 'centraladmin')
        }


      }
*/
    } 
  }

  async exit() {
    const login = await this.stg.getLogin();
    this.storage.set('login', []).then(() => {

      if (login) {


        this.api.closeSession({
          token: login[0].token
        }).then(() => {
          login[0].UserID = login[0]._id
          this.socketService.exitUser(login);
          this.socketService.disconnectEmit(login);
          if (login[0].isCentral == 1) {
            this.socketService.disconnect(login[0].WorkZone + 'central');
          }
          if (login[0].isCentralAdmin == 1) {
            this.socketService.disconnect(login[0].WorkZone + 'centraladmin');
          }
          // @ts-ignore
          google.accounts.id.initialize({
            client_id: "1030069149845-4tidjttl1q56v0h74sv3mmsuasugr8eh.apps.googleusercontent.com",
          });
          // @ts-ignore
          google.accounts.id.disableAutoSelect()

          // @ts-ignore 
          google.accounts.id.revoke(localStorage.getItem('email'), (done) => {
            localStorage.clear();

            this.router.navigate(['/home'])
          })


        })


      }





    })
  }

  async form() {
    try {
      const login = await this.stg.getLogin();

      if (login.length > 0) {
       
          let work = login[0].WorkZone;

          if (work == 6842) {
            this.router.navigate(['/medellinform'])
          }
          if (work == 6993) {
            this.router.navigate(['/rionegroform'])
          }

          if (work == 1001) {
            this.router.navigate(['/form-pruebas'])
          }
        

        this.menuCtrl.toggle('menu')
      }
    } catch (error) {

    }
  }

  async dash() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/dashboard'])
  }

  async control() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/control'])
  }
  async history() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/users'])
  }
  async listas() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/ubicaciones'])
  }

  async motivos() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/motivos'])
  }

  async motivos2() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/motivos-form'])
  }

  async reportes() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/tabla'])
  }

  async recursos() {
    this.menuCtrl.toggle('menu')
    this.router.navigate(['/recursos'])
  }


  initializeApp() {
    this.platform.ready().then(async () => {

      await this.storage.create();
      const platforms = this.platform.platforms();

      // if (platforms.includes('desktop')) {
      this.createdCollections().then(() => {

        this.dataRole()



        //   this.myPlatform.changePlatform('web');
      }).catch((err) => {
        console.log('Error ', err);
      });
      // }
    });
  }

  async createdCollections() {

    const login = await this.storage.get('login');


    if (!login) {
      await this.storage.set('login', []);
    } else {

    }





  }
}
