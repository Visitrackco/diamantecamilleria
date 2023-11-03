import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ApiService } from 'src/app/Services/api.service';
import { ObserverService } from 'src/app/Services/observer.service';
import { SocketService } from 'src/app/Services/Sockets.service';
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
  zoneName = '';
  load;

  @Input() dash;


  constructor(
    private stg: StorageWebService,
    private storage: Storage,
    private pov: PopoverController,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
    private socketService: SocketService,
    private obs: ObserverService
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.stg.getLogin().then((data) => {
      if (data.length > 0) {
        this.logo = data[0].picture == 1 ? data[0].pictureUrl : '/assets/avatar.svg'
        this.name = data[0].FirstName;
        this.zoneSelect = data[0].WorkZone;
        if (this.zoneSelect == 6993) {
          this.zoneName = 'RioNegro'
        } else  if (this.zoneSelect == 6842) {
          this.zoneName = 'Medellin'
        }
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
            this.close();
            this.router.navigate(['/home'])
          })


        })

      }




    })
  }


  async changeZone(event) {
    try {
      const login = await this.stg.getLogin();

      this.socketService.disconnect((login[0].WorkZone + 'central').toString())
      this.socketService.disconnect((login[0].WorkZone + 'centraladmin').toString())

      console.log(login[0].WorkZone + 'central')

      await this.stg.putZone(event.detail.value.IDVT);
      this.zoneSelect = event.detail.value.IDVT;

   
/*
      if (this.zoneSelect == 6842) {
        this.router.navigate(['/medellinform'])
      }
      if (this.zoneSelect == 6993) {
        this.router.navigate(['/rionegroform'])
      } */



      if (this.zoneSelect == 6993) {
        this.zoneName = 'RioNegro'
      } else  if (this.zoneSelect == 6842) {
        this.zoneName = 'Medellin'
      }

      if (login[0].isCentral == 1) {
        this.socketService.hospitalCentral(this.zoneSelect + 'central')
      }
      if (login[0].isCentralAdmin == 1) {
        this.socketService.hospitalCentral(this.zoneSelect + 'centraladmin')
      }
      this.router.navigate(['/dashboard'])

      
        this.obs.load(true)
      
      //this.close();

    } catch (error) {

    }


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
