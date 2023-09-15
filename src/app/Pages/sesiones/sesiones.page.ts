import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

@Component({
  selector: 'app-sesiones',
  templateUrl: './sesiones.page.html',
  styleUrls: ['./sesiones.page.scss'],
})
export class SesionesPage implements OnInit {

  constructor(
    private stg: StorageWebService,
    private toast: ToastService,
    private api: ApiService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter(){
    this.getSessions()
  }

  async getSessions() {
    const login = await this.stg.getLogin();

    if (login) {
      try {
        const rs = await this.api.getSessions({token: login[0].token})

        console.log(rs, 'co');
      } catch (error) {
        
      }
    }
  }

}
