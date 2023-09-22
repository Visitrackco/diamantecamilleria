import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {



  displayedColumns =
    ['estado', 'fecha', 'recibido', 'motivo', 'origen', 'destino', 'camillero', 'obscentral', 'obs', 'acc'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  loadActivities;

  loading;

  interval;

  locations = [];
  selectedStates = [];
  motivosList = [];

  motivoSelect;
  origenSelec;
  DestinoSelect;

  filter;

  // usuarios

  users = [];
  stop;


  // tiempos 


  tiempos = {
    verde: 6,
    amarillo: 10,
    rojo: 11
  }

  @ViewChild('mot') mot: MatSelect;
  @ViewChild('org') org: MatSelect;
  @ViewChild('des') des: MatSelect;


  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController
  ) {
    this.socket.newActivityOn().subscribe({
      next: (data: any) => {

        if (data.data) {
          if (data.data.future) {
            return;
          }
          let fila = [...this.dataSource.data];

          let element = data.data;
          let fecha = element.JSONAnswers.filter((it) => it.apiId == 'FECHA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'FECHA')[0].Value : ''
          let hora = element.JSONAnswers.filter((it) => it.apiId == 'HORA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'HORA')[0].Value : ''


          let paciente = element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE')[0].Value : ''

          let recursos = element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS')[0].Value : ''

          let aislado = element.JSONAnswers.filter((it) => it.apiId == 'AISLADO').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'AISLADO')[0].Value : ''

          let obs = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1')[0].Value : ''

          let fechaSolicitud = fecha + ' ' + hora;


          if (element.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO') {
            element.estado = 'pending'

            let actual = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm')
            let diff = moment(actual).diff(moment(fechaSolicitud), 'minutes');
            let color = '';
            if (diff <= this.tiempos.verde) {
              color = 'verde';
            } else if (diff >= (this.tiempos.verde + 1) && diff <= this.tiempos.amarillo) {
              color = 'amarillo';
            } else if (diff >= this.tiempos.rojo) {
              color = 'rojo'
            }

            element.color = color;

          }

          let obj = {
            estado: element.CompanyStatus,
            fecha: fechaSolicitud,
            recibido: element.Received,
            motivo: element.Motivo.Name,
            origen: element.Origen.Name,
            destino: element.Destino.Name,
            camillero: element.AssignedTo,
            obscentral: '',
            obs: {
              paciente,
              recursos,
              aislado,
              obs
            },
            acc: element
          };

          fila.unshift(obj)
          this.dataSource.data = fila;
        }







        const audio = new Audio('/assets/notification.mp3')
        audio.play()

      },
      error: (err) => console.error(err)
    })

    this.socket.connectuser().subscribe((data: any) => {
      console.log(data)
      if (data.data) {
        const idx = this.users.findIndex((it) => it._id == data.data.UserID)

        if (idx >= 0) {

          this.users[idx].isConnect = 1;

          this.orderUser()

          let audio = new Audio('/assets/connect.mp3');
          audio.play();
        }
      }
    })

    this.socket.disconnectuser().subscribe((data: any) => {
      console.log(data)

      if (data.data) {
        const idx = this.users.findIndex((it) => it._id == data.data.UserID)

        if (idx >= 0) {
          if (data.data.desc == 1) {
            this.users[idx].isConnect = 0.5;
          } else if (data.data.desc == 0) {
            this.users[idx].isConnect = 1;
            let audio = new Audio('/assets/connect.mp3');
            audio.play();
          } else {
            this.users[idx].isConnect = 0;
          }

          this.orderUser();

        }
      }
    })

    this.interval = setInterval(() => {
     if (!this.stop) {
      this.getSolicitudes()
     }
    }, 30000)
  }

  orderUser() {
    this.users = this.users.sort((a, b) => {
      if (a.isConnect > b.isConnect) {
        return -1;
      }
      if (a.isConnect < b.isConnect) {
        return 1;
      }
      return 0;
    })
  }

  ngOnInit() {
  }

  async ionViewWillEnter() {



    const login = await this.stg.getLogin();

    if (login) {



      this.api.getLocationByZone({
        WorkZoneID: login[0].WorkZone
      }).then((rs) => {

        this.locations = rs.response;
        this.selectedStates = this.locations;

        this.api.getWMotivos(login[0].WorkZone
        ).then((rsMotivo) => {

          this.motivosList = rsMotivo.response;

          this.getSolicitudes();
          this.getUsers();
        })


      })
    }
  }

  async getUsers() {
    const login = await this.stg.getLogin();

    if (login) {
      try {
        const rs = await this.api.apiGet('usersworkzone?WorkZoneID=' + login[0].WorkZone, login[0].token)

        if (rs) {
          console.log(rs, 'RS')
          this.users = rs.response;
        }
      } catch (error) {

      }
    }
  }


  select(event, type) {

    if (type == 1) {
      this.motivoSelect = event.value._id;
    }
    if (type == 2) {
      this.origenSelec = event.value._id;
    }
    if (type == 3) {
      this.DestinoSelect = event.value._id;
    }

    this.filter = true;

    this.getSolicitudes();
  }

  onKey(value) {
    this.selectedStates = this.search(value.target.value);
  }

  search(value: any) {

    let filter = value.toLowerCase();

    return this.locations.filter(option => {

      let name = option.Name.toLowerCase()
      return name.includes(filter)
    });
  }

  clear() {
    this.mot.writeValue('');
    this.org.writeValue('');
    this.des.writeValue('');
    this.motivoSelect = false;
    this.origenSelec = false;
    this.DestinoSelect = false;
    this.filter = true;
    this.getSolicitudes();
  }


  async getSolicitudes() {
    const login = await this.stg.getLogin();

    if (login) {

      if (this.filter) {
        this.dataSource.data = [];
      }

      this.api.apiPost('searchActivity', {
        token: login[0].token,
        WorkZoneID: login[0].WorkZone,
        Format: 'America/Bogota',
        Motivo: this.motivoSelect,
        Origen: this.origenSelec,
        Destino: this.DestinoSelect,
      }).then((data: any) => {

        this.filter = false;

        if (!data.status) {
          this.toast.MsgError(data.err);
          this.loadActivities = true;
          return;
        }

        console.log(data);
        let fila = [...this.dataSource.data];
        let pendings = data.response.filter((it) => it.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO')
        pendings = this.order(pendings, 'UpdatedOn', true)
        pendings.forEach(element => {
          let fecha = element.JSONAnswers.filter((it) => it.apiId == 'FECHA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'FECHA')[0].Value : ''
          let hora = element.JSONAnswers.filter((it) => it.apiId == 'HORA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'HORA')[0].Value : ''


          let paciente = element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE')[0].Value : ''

          let recursos = element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS')[0].Value : ''

          let aislado = element.JSONAnswers.filter((it) => it.apiId == 'AISLADO').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'AISLADO')[0].Value : ''

          let obs = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1')[0].Value : ''

          let fechaSolicitud = fecha + ' ' + hora;

          let exist = fila.findIndex((it) => it.acc._id == element._id);

          if (element.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO') {
            element.estado = 'pending'
          } else if (element.CompanyStatus == 'SOLICITUD CON CAMILLERO') {
            element.estado = 'assigned'
          }

          let actual = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm')
          let diff = moment(actual).diff(moment(fechaSolicitud), 'minutes');
          let color = '';
          if (diff <= this.tiempos.verde) {
            color = 'verde';
          } else if (diff >= (this.tiempos.verde + 1) && diff <= this.tiempos.amarillo) {
            color = 'amarillo';
          } else if (diff >= this.tiempos.rojo) {
            color = 'rojo'
          }

          element.color = color;

          let obj = {
            estado: element.CompanyStatus,
            fecha: fechaSolicitud,
            recibido: element.Received,
            motivo: element.Motivo.Name,
            origen: element.Origen.Name,
            destino: element.Destino.Name,
            camillero: element.AssignedTo,
            obscentral: '',
            obs: {
              paciente,
              recursos,
              aislado,
              obs
            },
            acc: element
          };

          if (exist >= 0) {
            fila[exist] = obj
          } else {
            fila.push(obj)
          }

        });
        data.response = data.response.filter((it) => it.CompanyStatus != 'PENDIENTE ASIGNACION CAMILLERO');
        data.response = this.order(data.response, 'UpdatedOn', true)
        data.response.forEach(element => {
          let fecha = element.JSONAnswers.filter((it) => it.apiId == 'FECHA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'FECHA')[0].Value : ''
          let hora = element.JSONAnswers.filter((it) => it.apiId == 'HORA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'HORA')[0].Value : ''


          let paciente = element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE')[0].Value : ''

          let recursos = element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS')[0].Value : ''

          let aislado = element.JSONAnswers.filter((it) => it.apiId == 'AISLADO').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'AISLADO')[0].Value : ''

          let obs = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1')[0].Value : ''

          let fechaSolicitud = fecha + ' ' + hora;

          let exist = fila.findIndex((it) => it.acc._id == element._id);

          if (element.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO') {
            element.estado = 'pending'
          } else if (element.CompanyStatus == 'SOLICITUD CON CAMILLERO') {
            element.estado = 'assigned'
          }

          let obj = {
            estado: element.CompanyStatus,
            fecha: fechaSolicitud,
            recibido: element.Received,
            motivo: element.Motivo.Name,
            origen: element.Origen.Name,
            destino: element.Destino.Name,
            camillero: element.AssignedTo,
            obscentral: '',
            obs: {
              paciente,
              recursos,
              aislado,
              obs
            },
            acc: element
          };

          if (exist >= 0) {
            fila[exist] = obj
          } else {
            fila.push(obj)
          }

        });

   



        this.dataSource.data = fila;
        this.loadActivities = true;

      })
    }

  }


  order(arr, param, desc?) {
    return arr.sort((a, b) => {

      if (a[param] > b[param]) {
        return desc ? -1 : 1;
      }

      if (a[param] > b[param]) {
        return desc ? 1 : -1;
      }

      return 0
    })
  }

  dropped(event: CdkDragDrop<string[]>) {
    this.stop = false;
    console.log(event)

    if (event.previousContainer === event.container) {
      console.log('No hago nada')
    //  moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      let data: any = event.container.data;
      if (data) {
        if (data.isConnect != 1) {
          this.toast.MsgError('No puede asignar a este camillero, no se encuentra conectado', 3000)
        } else {
          this.assigment(data, event.item.data);
        }
      }
      console.log( event.item.data)
    }

  }

  async assigment(user, data) {
    const alert = await this.alertCtrl.create({
      header: 'Asignaciòn para ' + user.FirstName,
      message: 'Una vez aceptado, se asignarà la actividad al celular del camillero',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: async () => {
           
            this.assigned(user, data);
           
          }
        }
      ]
    })

    await alert.present();
  }

  async assigned(user, data) {
    const login = await this.stg.getLogin();

    if (login) {
      try {
        this.loading = true;
        const rs = await this.api.apiPost('asigment', {
          _id: user._id,
          WorkZoneID: login[0].WorkZone,
          solicitud: data.acc._id,
          token: login[0].token
        })

        console.log(rs)

        if (!rs.status) {
          this.toast.MsgError(rs.err);
          this.loading = false;
          return;
        }

        this.filter = true;

        this.getSolicitudes();

        this.toast.MsgOK('Asignado')

        this.loading = false;
      } catch (error) {
        this.loading = false;
      }
    }
  }

  onDragover(event) {
    console.log(event)
  }

  stopIt(w) {
    console.log('parando')
   
    this.stop = true;
  }
  stopOut(w) {
    console.log('corriendo')
   
    this.stop = true;
  }

  ionViewWillLeave() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

}
