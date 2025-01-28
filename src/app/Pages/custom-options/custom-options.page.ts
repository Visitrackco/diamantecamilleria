import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import { AlertController, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomOptionComponent } from 'src/app/Components/asociative/asociative.component';

@Component({
  selector: 'app-custom-options',
  templateUrl: './custom-options.page.html',
  styleUrls: ['./custom-options.page.scss'],
})
export class CustomOptionsPage implements OnInit {

  
  displayedColumns =
    ['name', 'ref', 'motivo', 'acc'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;


  loadActivities;


  loading;


  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController,
    private router: Router,
    private activate: ActivatedRoute,
    private modalCtrl: ModalController
  ) {



  }



  async ngOnInit() {


  }

  async ionViewWillEnter() {


    const login = await this.stg.getLogin();

    if (login) {

      this.getHistory();

    }

  }

  async getHistory() {
    moment.locale('es')
    const login = await this.stg.getLogin();

    if (login) {
      try {

        this.dataSource.data = [];
        const rs = await this.api.apiGet('customoptions?WorkZoneID=' + login[0].WorkZone, login[0].token)

        if (rs) {
          console.log(rs)
          let fila = [...this.dataSource.data];
          rs.response.forEach(element => {
            let obj = {
              name: element.Name,
              ref: element.Api,
              motivo: element.Motivo,
              acc: element
            }
            fila.push(obj)
          });
          this.dataSource.data = fila;

          this.dataSource.paginator = this.paginator;

          this.loadActivities = true;


        }
      } catch (error) {
        this.loadActivities = true;
      }
    }
  }



  filtrar(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  cancel() {

    this.dataSource.filter = '';
  }

  async deletePoint(point) {

    const alert = await this.alertCtrl.create({
      header: 'Eliminar ' + point.name,
      message: 'Una vez aceptado, se eliminarà el punto de forma permanente',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: async () => {

            this.loading = true;

            const login = await this.stg.getLogin();

            if (login) {
              try {

                  
                const rs = await this.api.apiDelete('customoptions?_id=' + point.acc._id, login[0].token)

                if (rs) {

                  this.loading = false;

                  if (!rs['status']) {
                    this.toast.MsgError(rs['err'])
                    return;
                  }

                  this.getHistory();



                  this.toast.MsgOK('Punto eliminado')
                }
              } catch (error) {
                this.loadActivities = true;
                this.loading = false;
              }
            }

          }
        }
      ]
    })

    return await alert.present();

  }

  async editPoint(data) {



    const modal = await this.modalCtrl.create({
      component: CustomOptionComponent,
      componentProps: {
        data
      }
    })

    await modal.present()

  }



  async create() {

    const modal = await this.modalCtrl.create({
      component: CustomOptionComponent
    })

    await modal.present()
  }

  change(event, i) {

    let fila = [...this.dataSource.data];
    let idx = fila.findIndex((it) => it.acc._id == i._id);

    if (idx >= 0) {
      fila[idx].admin = event.detail.checked ? 1 : 0;

  

      this.dataSource.data = fila;
    }
  }

  change2(event, i, property) {

    let fila = [...this.dataSource.data];
    let idx = fila.findIndex((it) => it.acc._id == i._id);
    if (idx >= 0) {
      fila[idx][property] = property == 'ans' ? parseFloat(event.detail.value): event.detail.value;

      this.dataSource.data = fila;
    }
  }



  ionViewWillLeave() {
    this.dataSource.data = [];
  }



}
