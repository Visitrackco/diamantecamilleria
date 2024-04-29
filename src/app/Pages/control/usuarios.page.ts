import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import { AlertController } from '@ionic/angular';
import { elementAt } from 'rxjs';


@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit {

  displayedColumns =
    ['estado', 'name', 'login', 'clave', 'islock', 'isdelete', 'isassigment', 'central', 'centraladmin', 'programmer', 'zones', 'acc'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  loadActivities;


  loading;

  zones = [6842, 6993, 1001]


  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController
  ) {

    this.socket.connectuser().subscribe((data: any) => {
      console.log(data)
      if (data.data) {
        let fila = [...this.dataSource.data]

        const idx = fila.findIndex((it) => it.acc._id == data.data.UserID)

        if (idx >= 0) {

          fila[idx].estado = 1;
          fila[idx].islock = 0;
          fila[idx].acc.isConnect = 1;


          fila = this.orderUser(fila)

          this.dataSource.data = fila;

          let audio = new Audio('/assets/connect.mp3');
          audio.play();
        }
      }
    })

    this.socket.disconnectuser().subscribe((data: any) => {

      if (data.data) {
        let fila = [...this.dataSource.data]

        const idx = fila.findIndex((it) => it.acc._id == data.data.UserID)

        if (idx >= 0) {
          if (data.data.desc == 1) {
            fila[idx].estado = 0.5;
            fila[idx].acc.isConnect = 0;
          } else if (data.data.desc == 0) {
            fila[idx].estado = 1;
            let audio = new Audio('/assets/connect.mp3');
            audio.play();
          } else {
            fila[idx].acc.isConnect = 0;
            fila[idx].estado = 0;
          }



          fila = this.orderUser(fila)

          this.dataSource.data = fila;
        }
      }
    })

  }


  orderUser(arr) {
    return arr.sort((a, b) => {
      if (a.acc.isConnect > b.acc.isConnect) {
        return -1;
      }
      if (a.acc.isConnect < b.acc.isConnect) {
        return 1;
      }
      return 0;
    })
  }

  ngOnInit() {
  }

  cancel() {
    this.dataSource.filter = '';
  }

  async ionViewWillEnter() {
    const login = await this.stg.getLogin();

    if (login) {

      this.getUsers();

    }
  }

  async getUsers() {
    const login = await this.stg.getLogin();

    if (login) {
      try {

        this.dataSource.data = [];
        const zones = await this.api.apiGet('workzones', login[0].token)

        this.zones = zones.response;



        const rs = await this.api.apiGet('usersworkzone?WorkZoneID=' + login[0].WorkZone + '&all=1', login[0].token)

        if (rs) {
          let fila = [...this.dataSource.data];
     

          rs.response.forEach(element => {

            let nuevo = [];
            zones.response.forEach((item: any) => {


              nuevo.push({
                Name: item.Name,
                IDVT: item.IDVT,
                check: element.WorkZoneID.filter((it) => it === item.IDVT).length > 0 ? true : false
              })

            })

            console.log(nuevo, element.WorkZoneID, element.FirstName)
            let obj = {
              estado: element.isConnect,
              name: element.FirstName + ' ' + element.LastName,
              login: element.Login,
              clave: element.Password,
              islock: element.IsLocked,
              isdelete: element.isCantDelete,
              isassigment: element.isCantAssigment,
              central: element.isCentral,
              centraladmin: element.isCentralAdmin,
              programmer: element.isCantProgrammer,
              zones: nuevo,
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

  changeClave(event, ele) {

    const idx = this.dataSource.data.findIndex((it) => it.acc._id == ele._id)

    if (idx >= 0) {
      this.dataSource.data[idx].acc.Password = event.detail.value;
    }

  }

  async saveClave(ele) {

    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('changeClave', {
          _id: ele.acc._id,
          token: login[0].token,
          password: ele.acc.Password
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          this.toast.MsgOK('Proceso ejecutado correctamente')

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }


  filtrar(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  async changeWorzone(event) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      if (event.detail.checked) {
        let idx = event.detail.value.data.WorkZoneID.findIndex((it) => it == event.detail.value.id)

        if (idx < 0) {
          event.detail.value.data.WorkZoneID.push(event.detail.value.id)
        }
      } else {
        let idx = event.detail.value.data.WorkZoneID.findIndex((it) => it == event.detail.value.id)

        if (idx >= 0) {
          event.detail.value.data.WorkZoneID.splice(idx, 1)
        }
      }

      try {
        let rs = await this.api.apiPost('changeZones', {
          _id: event.detail.value.data._id,
          token: login[0].token,
          zones:  event.detail.value.data.WorkZoneID
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

   

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

  async changeLock(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('islock', {
          _id: data.acc._id,
          token: login[0].token,
          lock: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

  async changeDelete(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isdelete', {
          _id: data.acc._id,
          token: login[0].token,
          delete: event.detail.checked ? 1 : 0
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

  async changeAssigment(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isassigment', {
          _id: data.acc._id,
          token: login[0].token,
          assigment: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            //this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

  async changeC(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isCentral', {
          _id: data.acc._id,
          token: login[0].token,
          central: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            //this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }


  async changeCA(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isCentralAdmin', {
          _id: data.acc._id,
          token: login[0].token,
          centraladmin: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            //this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

}
