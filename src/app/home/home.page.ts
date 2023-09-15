import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, MenuController } from '@ionic/angular';
import { ApiService } from '../Services/api.service';
import { ObserverService } from '../Services/observer.service';
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

  rg: any= [];
  load = false;

   constructor(
    private loading: LoadingController,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private storage: StorageWebService,
    private menu: MenuController,
    private obs: ObserverService
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
        {   type:"standard",
        size:"large",
     
        width: '400px',
        height: '70px',
        shape:"rectangular",
        
        logo_alignment:"left"}
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
    }).then((rs) => this.entryLogi(rs)).catch(() =>  this.load = false)
  }

   ionViewWillEnter(){
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

  async entryLogi(rs: any) {
    console.log(rs)
    if (!rs.status) {
      this.load = false;
      this.toast.MsgError(rs.err)
      return;
    }

    delete rs.response.Password

    let obj = rs.response;

    obj.infoRole = rs.rsRole;
    obj.token = rs.token

  
    localStorage.setItem('email', obj.Login)
    this.obs.logo(obj.picture == 1 ? obj.pictureUrl : '/assets/avatar.svg')
    this.obs.role(obj.infoRole)


/*    if (obj.WorkZoneID.length > 1) {
      obj.WorkZone = obj.WorkZoneID[0];

      let work = obj.WorkZone;

      await this.storage.insertUser(obj)
    } else {
     
*/
      obj.WorkZone = obj.WorkZoneID[0];

      let work = obj.WorkZone;

      await this.storage.insertUser(obj)

      if (work == 6842) {
        this.router.navigate(['/medellinform'])
      }
      if (work == 6993) {
        this.router.navigate(['/rionegroform'])
      }
   // }

  


    this.toast.MsgOK('Bienvenid@ ' +  obj.FirstName)
    this.load = false;
  }

  change(event: any, type: number) {
    if (type == 1) {
      this.login.user = event.detail.value;
    } else {
      this.login.password = event.detail.value;
    }

    
  }
}
