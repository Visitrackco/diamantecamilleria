import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {

  logo;
  name;

  zones = [];
  zoneSelect;
  load;

  constructor(
    private stg: StorageWebService,
    private storage: Storage,
    private pov: PopoverController,
    private router: Router,
    private api: ApiService,
    private toast: ToastService
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.stg.getLogin().then((data) => {
      if (data.length > 0) {
        this.logo = data[0].picture == 1 ? data[0].pictureUrl : '/assets/avatar.svg'
        this.name = data[0].FirstName;
        this.zoneSelect = data[0].WorkZone;
        if (data[0].WorkZoneID.length > 1) {
          this.getworkzones(data[0].WorkZoneID)
        }

      }
    })
  }

  async close() {
    await this.pov.dismiss()
  }

  async getworkzones(zones) {
    try {
      this.load = true;
      const rs = await this.api.getWorkZones({
        zones
      })

      if (rs) {
        this.load = false;
        if (!rs.status) {
       
          return;
        }
        this.zones = rs.response;
      }

    } catch (error) {
     
      this.load = false;
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

        this.close();
        this.router.navigate(['/home'])
      })



    })
  }


  async changeZone(event) {
    await this.stg.putZone(event.detail.value.IDVT);
    this.zoneSelect = event.detail.value.IDVT;



    if (this.zoneSelect == 6842) {
      this.router.navigate(['/medellinform'])
    }
    if (this.zoneSelect == 6993) {
      this.router.navigate(['/rionegroform'])
    }

    //this.close();



  }

  history() {
    this.router.navigate(['session'])
    this.close()
  }

  account() {
    this.router.navigate(['account'])
    this.close()
  }

}
