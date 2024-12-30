import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import { AlertController, ModalController } from '@ionic/angular';
import { elementAt } from 'rxjs';
import { DescansosComponent } from 'src/app/Components/descansos/descansos.component';

@Component({
  selector: 'app-descansos',
  templateUrl: './descansos.page.html',
  styleUrls: ['./descansos.page.scss'],
})
export class DescansosPage implements OnInit {

  displayedColumns =
  ['user', 'desayuno', 'almuerzo', 'cena', 'libre', 'acc'];
dataSource = new MatTableDataSource([]);

@ViewChild('paginatorHistory') paginator: MatPaginator;


  loadConfig;


  loading;

  public withConfig = false;


  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {


  }


  ngOnInit() {
  }

  cancel() {
    this.dataSource.filter = '';
  }

  async ionViewWillEnter() {
    const login = await this.stg.getLogin();

    if (login) {

      this.getDesc();

    }
  }

  async getDesc() {
    const login = await this.stg.getLogin();

    if (login) {
      try {

        this.dataSource.data = [];
        const descInfo = await this.api.apiGet('descansos?zone=' + login[0].WorkZone, login[0].token)

        this.loadConfig = true;

        if (!descInfo.status) {
          this.toast.MsgError(descInfo.err)
          return;
        }

        console.log(descInfo)

        if (descInfo.response.length == 0) {
          this.withConfig = false;
          return;
        } 

        const rows = [];

        descInfo.response.forEach(l => {
          if (l.data) {
            rows.push({
              user: l.nombre.FirstName + ' ' + l.nombre.LastName,
              desayuno: l.data.Desayuno,
              almuerzo: l.data.Almuerzo,
              cena: l.data.Cena,
              libre: l.data.Libre,
              acc: l
            })
          }
          
        });
  

   
        this.dataSource.data = rows;
        this.dataSource.paginator = this.paginator;
        this.withConfig = true;
    
      } catch (error) {
        this.loadConfig = true;
      }
    }
  }


  async openConfig(config?, byuser?) {
    const modal = await this.modalCtrl.create({
      component: DescansosComponent,
      componentProps: {
        config,
        byuser
      }
    })

    await modal.present();

    const rs = await modal.onWillDismiss()

    if (rs.data) {
      if (rs.data.reload) {
        this.getDesc()
      }
    }
  }

}
