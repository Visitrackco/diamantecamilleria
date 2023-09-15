import { Component, OnInit } from '@angular/core';
import { MenuController, PopoverController } from '@ionic/angular';
import { ObserverService } from 'src/app/Services/observer.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { PerfilComponent } from '../perfil/perfil.component';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
})
export class OptionsComponent implements OnInit {

  logo = '/assets/avatar.svg';

  constructor(
    private menuCtrl: MenuController,
    private stg: StorageWebService,
    private popover: PopoverController,
    private obs: ObserverService
  ) { 
    this.obs.$LogoObs.subscribe((data) => this.logo = data)
  }

  ngOnInit() {

    this.stg.getLogin().then((data) => {
      if (data.length > 0) {
        this.logo = data[0].picture == 1 ? data[0].pictureUrl : '/assets/avatar.svg'
      }
    })

  }


  menu() {
    this.menuCtrl.toggle('menu')
  }

  async options(event) {
    const pov = await this.popover.create({
      component: PerfilComponent,
      event,
      cssClass: 'ancho',
      showBackdrop: false
    })

    await pov.present();
  }


}
