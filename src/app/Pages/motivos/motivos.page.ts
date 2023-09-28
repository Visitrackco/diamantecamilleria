import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import { AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-motivos',
  templateUrl: './motivos.page.html',
  styleUrls: ['./motivos.page.scss'],
})
export class MotivosPage implements OnInit {

  displayedColumns =
  ['name', 'acc'];
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
  private activate: ActivatedRoute
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
      const rs = await this.api.apiGet('demora?WorkZoneID=' + login[0].WorkZone, login[0].token)

      if (rs) {
        console.log(rs)
        let fila = [...this.dataSource.data];
        rs.response.forEach(element => {
          let obj = {
            name: element.Name,
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
    header: 'Eliminar ' + point.Name,
    message: 'Una vez aceptado, se eliminarà el motivo de forma permanente',
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
      
       
              const rs = await this.api.apiDelete('demora?_id=' + point._id, login[0].token)
      
              if (rs) {

                this.loading = false;

                if (!rs['status']) {
                  this.toast.MsgError(rs['err'])
                  return;
                }
              
                this.getHistory();

     
      
                this.toast.MsgOK('Motivo eliminado')
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

async editPoint(point) {

  const alert = await this.alertCtrl.create({
    header: 'Editar ' + point.Name,
    message: 'Modifique el nombre',
    inputs: [
   
      {
        placeholder: 'Nombre',
        type: 'text',
        name: 'name',
        value: point.Name
      },
    
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Aceptar',
        handler: async (data) => {

          if (!data.name) {
            this.toast.MsgError('No puede enviar el nombre vacios.')
            return;
          }

   

          this.loading = true;

          const login = await this.stg.getLogin();

          if (login) {
            try {
              data._id = point._id;
              data.token = login[0].token;
       
              const rs = await this.api.apiPost('demoraEdit', data)
      
              if (rs) {

                if (!rs['status']) {
                  this.toast.MsgError(rs['err'])
                  return;
                }
              
                this.getHistory();

                this.loading = false;

                this.toast.MsgOK('Motivo modificado')
      
      
              }
            } catch (error) {
     
              this.loading = false;
            }
          }

        }
      }
    ]
  })

  await alert.present();
}



async create() {

  const alert = await this.alertCtrl.create({
    header: 'Crear motivo ',
    message: '',
    inputs: [
     
      {
        placeholder: 'Nombre',
        type: 'text',
        name: 'Name',
        value: ''
      },
     
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Aceptar',
        handler: async (data) => {

          if (!data.Name) {
            this.toast.MsgError('No puede enviar el nombre vacios.')
            return;
          }

   

          this.loading = true;

          const login = await this.stg.getLogin();

          if (login) {
            try {
         
              data.token = login[0].token;
              data.IDVT = 0;
              data.Prioridad = 0;
              data.WorkZoneID = login[0].WorkZone;
       
              const rs = await this.api.apiPost('demora', data)
      
              if (rs) {

                console.log(rs)
                this.loading = false;

                if (!rs['status']) {
                  this.toast.MsgError(rs['err'])
                  return;
                }
              
                this.getHistory();

    

                this.toast.MsgOK('Motivo creado')
      
      
              }
            } catch (error) {
     
              this.loading = false;
            }
          }

        }
      }
    ]
  })

  await alert.present();
}

ionViewWillLeave() {
  this.dataSource.data = [];
}



}
