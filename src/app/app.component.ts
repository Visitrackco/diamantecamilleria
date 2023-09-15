
import { Component } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { StorageWebService } from './Services/storage.service';
import { ObserverService } from './Services/observer.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  role;


  constructor(
    private platform: Platform,
    private storage: Storage,
    private router: Router,
    private menuCtrl: MenuController,
    private stg: StorageWebService,
    private obs: ObserverService

  ) {

    this.initializeApp();

    this.obs.$roleInfo.subscribe((data) => {
     if (data.length > 0) {
      this.role = data[0];
    
     }
    })

  }


   ngOnInit() {
    // If using a custom driver:
    // await this.storage.defineDriver(MyCustomDriver)



 
  }

  async dataRole() {
    const login = await this.stg.getLogin();

    if (login.length > 0) {
      this.role = login[0].infoRole[0];

      console.log(this.role, 'ROLES')
    }
  }

  exit() {
    this.storage.set('login', []).then(() => {
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

  async form() {
    try {
      const login = await this.stg.getLogin();

      if (login.length > 0) {
        if (login[0].WorkZoneID.length > 1) {

        } else {
          let work = login[0].WorkZone;

          if (work == 6842) {
            this.router.navigate(['/medellinform'])
          }
          if (work == 6993) {
            this.router.navigate(['/rionegroform'])
          }
        }

        this.menuCtrl.toggle('menu')
      }
    } catch (error) {

    }
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
