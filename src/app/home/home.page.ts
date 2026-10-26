import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, MenuController } from '@ionic/angular';
import { Socket } from 'ngx-socket-io';
import { ApiService } from '../Services/api.service';
import { ObserverService } from '../Services/observer.service';
import { SocketService } from '../Services/Sockets.service';
import { StorageWebService } from '../Services/storage.service';
import { ToastService } from '../Services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  login = {
    user: '',
    password: ''
  }

  rg: any = [];
  load = false;

  constructor(
    private loading: LoadingController,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private storage: StorageWebService,
    private menu: MenuController,
    private obs: ObserverService,
    private socketService: SocketService,
    private alert: AlertController
  ) {

  }

  ngOnInit() {

    try {
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: "1030069149845-4tidjttl1q56v0h74sv3mmsuasugr8eh.apps.googleusercontent.com",
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,

      });
      // @ts-ignore
      google.accounts.id.renderButton(
        // @ts-ignore
        document.getElementById("google-button"),
        {
          type: "standard",
          size: "large",

          width: '400px',
          height: '70px',
          shape: "rectangular",

          logo_alignment: "left"
        }
      );
    } catch (error) {

    }
    // @ts-ignore
    // google.accounts.id.prompt((notification: PromptMomentNotification) => {});
  }

  async handleCredentialResponse(response: any) {
    // Here will be your response from Google.
    console.log(response);
    this.load = true;
    this.api.googleSingIn({
      token: response.credential
    }).then((rs) => {



      this.entryLogi(rs, response.credential)
    }).catch(() => this.load = false)
  }

  ionViewWillEnter() {
    this.menu.enable(false, 'menu')
  }

  async sessionInit() {

    try {

      this.load = true;

      this.api.getUser({
        Login: this.login.user,
        Password: this.login.password
      }).then(async (rs) => {

        this.entryLogi(rs)

      })
    } catch (error) {
      this.load = false;
    }

    // fetch('https://diamanteticvisitrack.com/surveys').then((response) => response.json().then(async(value: any) => {



  }

  async entryLogi(rs: any, token?) {
    console.log(rs)

    if (!rs.status) {
      this.load = false;
      if (rs.createUser) {
        await this.registroGoogle(rs, token);
      } else {
        this.toast.MsgError(rs.err)
      }

      return;
    }

    delete rs.response.Password

    let obj = rs.response;

    obj.infoRole = rs.rsRole;
    obj.token = rs.token


    localStorage.setItem('email', obj.Login)
    this.obs.logo(obj.picture == 1 ? obj.pictureUrl : '/assets/avatar.svg')
    this.obs.role(obj.infoRole)

    this.socketService.connect();



    /*    if (obj.WorkZoneID.length > 1) {
          obj.WorkZone = obj.WorkZoneID[0];
    
          let work = obj.WorkZone;
    
          await this.storage.insertUser(obj)
        } else {
         
    */
    obj.WorkZone = obj.WorkZoneID[0];

    let work = obj.WorkZone;

    if (obj.isCentral == 1) {
      this.socketService.hospitalCentral(work + 'central')
    }

    if (obj.isCentralAdmin == 1) {
      this.socketService.hospitalCentral(work + 'centraladmin')
    }


    await this.storage.insertUser(obj)

    // El menu lateral solo calcula "Indicadores (Dashboard)" al arrancar la app
    // (dataRole) o cuando llegan permisos por $permisos. Sin esto, al iniciar sesion
    // el item no aparece hasta recargar el navegador.
    this.obs.permisosDashboard({
      Dashboard: obj.Dashboard == 1 ? 1 : 0,
      DashboardPages: Array.isArray(obj.DashboardPages) ? obj.DashboardPages : []
    })

    this.socketService.connectEmit();
    this.socketService.initUser()

    this.router.navigate(['/dashboard'])

    this.menu.enable(true, 'menu')

    /*

    if (work == 6842) {
      this.router.navigate(['/medellinform'])
    }
    if (work == 6993) {
      this.router.navigate(['/rionegroform'])
    } */
    // }




    this.toast.MsgOK('Bienvenid@ ' + obj.FirstName)
    this.load = false;
  }

  // Usuario nuevo con Google. El servidor manda las zonas de su dominio de correo que
  // puede elegir (si es una sola entra directo). Otros dominios no llegan aca: no pueden entrar.
  async registroGoogle(rs: any, token) {
    const zonas: any[] = Array.isArray(rs.zonas) ? rs.zonas : [];

    if (!zonas.length) {
      this.toast.MsgError('No hay clínicas disponibles para registrarse');
      return;
    }

    if (zonas.length == 1) {
      await this.crearUsuarioGoogle(zonas[0].IDVT, token);
      return;
    }

    const alert = await this.alert.create({
      header: 'Mensaje',
      message: 'Escoge el hospital donde perteneces',
      inputs: zonas.map((z) => ({
        name: 'radio',
        type: 'radio' as const,
        value: z.IDVT,
        label: z.Name
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aceptar',
          handler: (data) => {
            if (!data) {
              this.toast.MsgError('Debe seleccionar un hospital');
              return false;
            }
            this.crearUsuarioGoogle(data, token);
            return true;
          }
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  async crearUsuarioGoogle(WorkZoneID, token) {
    this.load = true;

    const create = await this.api.googleRegistro({ token, WorkZoneID }).catch(() => null);

    if (!create || !create.status) {
      this.load = false;
      this.toast.MsgError(create && create.err ? create.err : 'No se pudo crear el usuario');
      return;
    }

    this.api.googleSingIn({
      token
    }).then((rss) => {
      this.entryLogi(rss, token)
    }).catch(() => this.load = false)
  }

  change(event: any, type: number) {
    if (type == 1) {
      this.login.user = event.detail.value;
    } else {
      this.login.password = event.detail.value;
    }


  }
}
