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
  selector: 'app-ubicaciones',
  templateUrl: './ubicaciones.page.html',
  styleUrls: ['./ubicaciones.page.scss'],
})
export class UbicacionesPage implements OnInit {

  displayedColumns =
  ['name', 'tag', 'torre', 'piso' , 'login' , 'logout', 'acc'];
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
      const rs = await this.api.apiGet('locations?WorkZoneID=' + login[0].WorkZone, login[0].token)

      if (rs) {
        console.log(rs)
        let fila = [...this.dataSource.data];
        rs.response.forEach(element => {
          let obj = {
            name: element.Name,
            tag: element.TagUID,
            torre: element.Torre,
            piso: element.Piso,
            login: element.Login == 1 ? true : false,
            logout: element.Logout == 1 ? true : false,
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

async change(event, ele, type) {
  let val = event.detail.checked ? 1 : 0;
  const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('markLocation', {
          _id: ele.acc._id,
          token: login[0].token,
          mode: type == 1 ? 'Login' : 'Logout',
          val
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
         //   this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }
}

async deletePoint(point) {

  const alert = await this.alertCtrl.create({
    header: 'Eliminar ' + point.Name,
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
      
       
              const rs = await this.api.apiDelete('locations?_id=' + point._id, login[0].token)
      
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

async editPoint(point) {

  const alert = await this.alertCtrl.create({
    header: 'Editar ' + point.Name,
    message: 'Modifique cualquier dato de la ubicaciòn seleccionada, 1. tag, 2. nombre, 3. torre/ bloque, 4. piso',
    inputs: [
      {
        
        placeholder: 'Tag',
        type: 'text',
        name: 'tag',
        value: point.TagUID
      },
      {
        placeholder: 'Nombre',
        type: 'text',
        name: 'name',
        value: point.Name
      },
      {
        placeholder: 'Torre',
        type: 'text',
        name: 'torre',
        value: point.Torre
      },
      {
        placeholder: 'Piso',
        type: 'text',
        name: 'piso',
        value: point.Piso
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Aceptar',
        handler: async (data) => {

          if (!data.tag || !data.name) {
            this.toast.MsgError('No puede enviar el tag o el nombre vacios.')
            return;
          }

   

          this.loading = true;

          const login = await this.stg.getLogin();

          if (login) {
            try {
              data._id = point._id;
              data.token = login[0].token;
       
              const rs = await this.api.apiPost('locationsEdit', data)
      
              if (rs) {

                if (!rs['status']) {
                  this.toast.MsgError(rs['err'])
                  return;
                }
              
                this.getHistory();

                this.loading = false;

                this.toast.MsgOK('Punto modificado')
      
      
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
    header: 'Crear punto ',
    message: '1. tag, 2. nombre, 3. torre/ bloque, 4. piso',
    inputs: [
      {
        
        placeholder: 'Tag',
        type: 'text',
        name: 'TagUID',
        value: ''
      },
      {
        placeholder: 'Nombre',
        type: 'text',
        name: 'Name',
        value: ''
      },
      {
        placeholder: 'Torre',
        type: 'text',
        name: 'Torre',
        value: ''
      },
      {
        placeholder: 'Piso',
        type: 'text',
        name: 'Piso',
        value: ''
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Aceptar',
        handler: async (data) => {

          if (!data.TagUID || !data.Name) {
            this.toast.MsgError('No puede enviar el tag o el nombre vacios.')
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
       
              const rs = await this.api.apiPost('locations', data)
      
              if (rs) {

                console.log(rs)
                this.loading = false;

                if (!rs['status']) {
                  this.toast.MsgError(rs['err'])
                  return;
                }
              
                this.getHistory();

    

                this.toast.MsgOK('Punto creado')
      
      
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
