import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { AlertController, ModalController } from '@ionic/angular';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HistoryComponent } from 'src/app/Components/history/history.component';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ObserverService } from 'src/app/Services/observer.service';
import { DetailComponent } from 'src/app/Components/detail/detail.component';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {



  displayedColumns =
    ['estado', 'fecha', 'recibido', 'motivo', 'origen', 'destino', 'camillero', 'obscentral', 'obs', 'obs3', 'acc', 'token'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  @ViewChild('ipt') ipt: ElementRef;

  loadActivities;
  clickUsers;

  loading;
  loadUsers = false;

  interval;

  locations = [];
  selectedStates = [];
  selectedStates2 = [];

  motivosList = [];
  motivosList2 = [];

  motivoSelect;
  origenSelec;
  DestinoSelect;

  filter;

  // usuarios

  users = [];
  users2 = [];
  stop;


  // tiempos 


  tiempos = {
    verde: 6,
    amarillo: 10,
    rojo: 11
  }

  isDelete = 0;
  isAssigment = 0;
  
  isAdmin = false;
  multiple = false;
  isAllStatus = false;
  isFilter = false;


  fechaFrom;
  fechaTo;

  fromtmp;
  totmp;


  dateServer;
  dateTime;

  @ViewChild('mot') mot: MatSelect;
  @ViewChild('org') org: MatSelect;
  @ViewChild('des') des: MatSelect;

  fromTemp;
  toTemp;

  myZone;


  myForm: FormGroup<any>;


  toggleUsers = false;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private obs: ObserverService
  ) {
    this.socket.newActivityOn().subscribe({
      next: async (data: any) => {

        const login = await this.stg.getLogin();

        if (data.data) {

          if (login[0].WorkZone != data.data.WorkZoneID) {
            return;
          }

          if (data.data.future) {
            return;
          }

          if (this.isAdmin && login[0].isCentralAdmin == 1) {
            if (data.data.isAdmin != 1) {
              return;
            }
          }

          if (this.isFilter) {
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

          let obs2 = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES2').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES2')[0].Value : ''


          
          let obs3 = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES3').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES3')[0].Value : ''

          let fechaSolicitud = fecha + ' ' + hora;


          if (element.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO') {
            element.estado = 'pending'

            let actual = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm')

            let color: any = this.getColor(element.Motivo.Ans, fechaSolicitud, actual);

            element.info = {
              color,
              ans: element.Motivo.Ans,
              diff: moment(actual).diff(moment(fechaSolicitud), 'minutes')
            }

            if (element.CreatedByID == login[0]._id && login[0].isCentral != 1) {
              color = '';
            }


            if (element.Activity) {
              color += ' apoyo';
            }

            element.color = color;

          }

          let obj = {
            estado: element.CompanyStatus,
            fecha: {
              s: fechaSolicitud,
              o: '',
              d: ''
            },
            recibido: element.Received ? moment(element.Received).tz('America/Bogota').format('YYYY-MM-DD HH:mm') : '',
            motivo: element.Motivo.Name,
            origen: element.Origen.Name,
            destino: element.Destino.Name,
            camillero: element.AssignedTo,
            obscentral: obs2,
            obs: {
              paciente,
              recursos,
              aislado,
              obs
            },
            obs3,
            acc: element,
            token: element._id
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

    this.socket.adicional().subscribe({
      next: (data) => {
        if (data) {
          this.getSolicitudes();
        }
      }
    })
    this.interval = setInterval(() => {
      if (!this.stop) {
        this.getSolicitudes()
      }
    }, 30000)

    this.obs.$reload.subscribe({
      next: (data) => {
        if (data) {
          if (this.mot) {
            this.mot.writeValue('');
          }
          if (this.org) {
            this.org.writeValue('');
          }
          if (this.des) {
            this.des.writeValue('');
          }


          this.motivoSelect = false;
          this.origenSelec = false;
          this.DestinoSelect = false;
          this.fechaFrom = '';
          this.fechaTo = '';
          this.fromTemp = '';
          this.toTemp = '';
          this.filter = true;
          this.isAllStatus = false;
          this.isFilter = false;

          if (this.myForm) {
            this.myForm.controls['from'].setValue('');
            this.myForm.controls['to'].setValue('');
          }
          this.users = [];
          this.midata()
        }
      }
    })
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

  ionViewWillEnter() {

    moment.locale('en')

    this.midata()

    this.stop = false;




  }

  async midata() {

    this.loadForm()

    const login = await this.stg.getLogin();

    if (login) {

      this.myZone = login[0].WorkZone

      /*  if (login[0].WorkZone == 6842) {
          this.tiempos  = {
            verde: 6,
            amarillo: 10,
            rojo: 11
          }
        } else {
          this.tiempos = {
            verde: 5,
            amarillo: 8,
            rojo: 9
          }
        } */

      if (login[0].isCentral == 1 && login[0].isCentralAdmin == 1) {
        this.multiple = true;
      } else {
      

        if (login[0].isCentralAdmin == 1) {
          this.isAdmin = true;
        } else {
          if (login[0].RoleID != 8) {
            this.isAdmin = true;
          }
        }

        if (login[0].isCentral == 1) {
          this.isAdmin = false;
        }

      }


      this.api.getDate({
        token: login[0].token,
        format: 'America/Bogota'
      }).then((server) => {

        this.dateServer = server.date;

        this.api.getLocationByZone({
          WorkZoneID: login[0].WorkZone,
          token: login[0].token
        }).then((rs) => {

          this.locations = rs.response;
          this.selectedStates = this.locations;
          this.selectedStates2 = this.locations;

          this.api.getWMotivos(login[0].WorkZone, login[0].token
          ).then((rsMotivo) => {

            this.motivosList = rsMotivo.response;
            this.motivosList2 = this.motivosList;

            this.getSolicitudes();
            this.getUsers();
          })


        })

      })
    }
  }



  loadForm() {
    this.myForm = this.fb.group({
      from: new FormControl('', [
        // validaciones síncronas


      ]),
      to: new FormControl('', [
        // validaciones síncronas


      ]),

    });
  }

  toogleU(event) {
    console.log(event.detail)
    this.toggleUsers = event.detail.checked;
    this.getUsers()
  }


  async getUsers() {
    const login = await this.stg.getLogin();

    if (login) {
      try {

        this.loadUsers = true;

        this.clickUsers = true;

        let hab = '0';

        if (login[0].isCentralAdmin == 1 && this.isAdmin) {
          hab = '1';
        } 

        const rs = await this.api.apiGet('usersworkzone?WorkZoneID=' + login[0].WorkZone + '&admin=' + hab, login[0].token)

        if (rs) {

    

          this.users = [];
          this.users2 = [];

          let user = [];

          rs.response = rs.response.sort((a, b) => {
            if (a.FirstName.trim() > b.FirstName.trim()) {
              return 1;
            }
            if (a.FirstName.trim() < b.FirstName.trim()) {
              return -1;
            }
            return 0;
          })


      


         
        

          console.log(rs.response)

         
          let disconnect =[]
          let connect = rs.response.filter((it) => it.isConnect == 1)
          let descanso = rs.response.filter((it) => it.isConnect == 0.5)

          rs.response = rs.response.filter((it) => it.isConnect > 0)

          for (const ele of connect) {

              const count = await this.api.apiGet('countSolicitudes?WorkZoneID=' + login[0].WorkZone + '&user=' + ele._id, login[0].token)

              if (count.status) {
                ele.count = count.response.count;
                ele.pendientes = count.response.pendientes;
              }
             /*else {
              const count = await this.api.apiGet('countSolicitudes?WorkZoneID=' + login[0].WorkZone + '&user=' + ele._id + '&logout=yes', login[0].token) 

              if (count.status) {
                ele.count = count.response;
              }
            } */

          //  user.push(ele);
            this.users.push(ele);
            this.users2.push(ele);

          }

          if (this.toggleUsers) {
 
            this.users2 = this.users2.sort((a, b) => {
              if (a.pendientes > b.pendientes) {
                return 1;
              }
              if (a.pendientes < b.pendientes) {
                return -1;
              }
              return 0;
            })
          }

          for (const ele of descanso) {

            const count = await this.api.apiGet('countSolicitudes?WorkZoneID=' + login[0].WorkZone + '&user=' + ele._id, login[0].token)

            if (count.status) {
              ele.count = count.response.count;
              ele.pendientes = count.response.pendientes;
            }
           /*else {
            const count = await this.api.apiGet('countSolicitudes?WorkZoneID=' + login[0].WorkZone + '&user=' + ele._id + '&logout=yes', login[0].token) 

            if (count.status) {
              ele.count = count.response;
            }
          } */

        //  user.push(ele);
          this.users.push(ele);
          this.users2.push(ele);

        }


          disconnect.forEach(element => {
            this.users.push(element);
            this.users2.push(element);
          });

          this.clickUsers = false;

          this.loadUsers = false;


        }
      } catch (error) {
        this.loadUsers = false;
        this.clickUsers = false;
      }
    }
  }


  async changePicker(event, type) {
    console.log(event)

    const login = await this.stg.getLogin()

    if (login) {
      this.api.getDate({
        token: login[0].token,
        format: 'America/Bogota'
      }).then((server) => {

        this.dateServer = server.date;
        this.dateTime = server.time;
        let check = false;

        let fecha = moment(event.value).utc().format('YYYY-MM-DD')
        if (type == 1) {
          //   this.fromTemp = fecha;
          this.fechaFrom = moment(fecha + ' ' + '00:00:00').utc().format('YYYY-MM-DD HH:mm:ss');
          this.fromtmp = moment(fecha).add(1, 'hours').format('YYYY-MM-DD')

        } else {
          //  this.toTemp = fecha;

          if (fecha < moment(this.dateServer).format('YYYY-MM-DD')) {
            check = true;
            this.fechaTo = moment(fecha + ' ' + '23:59:59').utc().format('YYYY-MM-DD HH:mm:ss');
          } else {

            this.fechaTo = moment(fecha + ' ' + this.dateTime + ':59').utc().format('YYYY-MM-DD HH:mm:ss');
          }

          this.totmp = moment(fecha).utc().format('YYYY-MM-DD')


        }

        if (this.fechaFrom && this.fechaTo) {
          if (check) {
            this.isFilter = true;
          } else {
            this.isFilter = false;
          }
          this.filter = true;
          this.getSolicitudes();
        }

      })
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

  onKey2(value) {
    this.motivosList = this.search2(value.target.value);
  }

  onKey(value, type) {
    if (type == 1) {
      this.selectedStates = this.search(value.target.value);
    } else {
      this.selectedStates2 = this.search(value.target.value);
    }

  }

  search2(value: any) {

    let filter = value.toLowerCase();

    return this.motivosList2.filter(option => {

      let name = option.Name.toLowerCase()
      return name.includes(filter)
    });
  }

  search(value: any) {

    let filter = value.toLowerCase();

    return this.locations.filter(option => {

      let name = option.Name.toLowerCase()
      return name.includes(filter)
    });
  }

  clear() {
    this.stop = false;
    this.mot.writeValue('');
    this.org.writeValue('');
    this.des.writeValue('');
    this.motivoSelect = false;
    this.origenSelec = false;
    this.DestinoSelect = false;
    this.fechaFrom = '';
    this.fechaTo = '';
    this.fromTemp = '';
    this.toTemp = '';
    this.filter = true;
    this.isAllStatus = false;
    this.isFilter = false;

    this.myForm.controls['from'].setValue('');
    this.myForm.controls['to'].setValue('');


    this.getSolicitudes();
  }


  getDifference(a, b) {
    return a.filter(element => {
      return !b.includes(element);
    });
  }

  getColor(ans: number, from, to): any {

    let diff = moment(to).diff(moment(from), 'minutes');

    if (ans <= 0) {
      return '';
    }

    let verde = parseFloat(((50 * ans) / 100).toFixed());
    let amarillo = parseFloat(((80 * ans) / 100).toFixed());

    console.log(verde, amarillo, ans)

    if (diff <= verde) {
      return 'verde';
    } else if (diff > verde && diff <= amarillo) {
      return 'amarillo';
    } else if (diff > amarillo) {
      return 'rojo'
    }

    return '';

  }

  async getSolicitudes() {
    this.stop = false;

    const login = await this.stg.getLogin();

    if (login) {

      this.isDelete = login[0].isCantDelete
      this.isAssigment = login[0].isCantAssigment

      if (this.filter) {

        this.loading = true;
        this.dataSource.data = [];
      }

      

      this.api.apiPost('searchActivity', {
        token: login[0].token,
        WorkZoneID: login[0].WorkZone,
        Format: 'America/Bogota',
        Motivo: this.motivoSelect,
        Origen: this.origenSelec,
        Destino: this.DestinoSelect,
        Desde: this.fechaFrom,
        Hasta: this.fechaTo,
        isAdmin: this.isAdmin ? 1 : 0,
        isAllStatus: this.isAllStatus ? 1 : 0
      }).then((data: any) => {

        this.filter = false;
        this.loading = false;

        if (!data.status) {
          this.toast.MsgError(data.err);
          this.loadActivities = true;
          return;
        }

        console.log(data);
        let fila = [...this.dataSource.data];


        fila.forEach((element, i) => {
          const exist = data.response.findIndex((it) => it._id == element.acc._id);

          if (exist < 0) {
            fila.splice(i, 1)
          }
        })


        let pendings = data.response.filter((it) => it.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO')
        pendings = this.order(pendings, 'UpdatedOn', true)
        console.log(pendings, 'PENDIENTES')
        pendings.forEach(element => {



          let fecha = element.JSONAnswers.filter((it) => it.apiId == 'FECHA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'FECHA')[0].Value : ''
          let hora = element.JSONAnswers.filter((it) => it.apiId == 'HORA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'HORA')[0].Value : ''


          let paciente = element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE')[0].Value : ''

          let recursos = element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS')[0].Value : ''

          let aislado = element.JSONAnswers.filter((it) => it.apiId == 'AISLADO').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'AISLADO')[0].Value : ''

          let obs = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1')[0].Value : ''

          let obs2 = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES2').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES2')[0].Value : ''

          let obs3 = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES3').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES3')[0].Value : ''


          let fechaSolicitud = fecha + ' ' + hora;

          let exist = fila.findIndex((it) => it.acc._id == element._id);

          if (element.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO') {
            element.estado = 'pending'
          } else if (element.CompanyStatus == 'SOLICITUD CON CAMILLERO') {
            element.estado = 'assigned'
          }

          let actual = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm')

          let color: any = this.getColor(element.Motivo.Ans, fechaSolicitud, actual);

          element.info = {
            color,
            ans: element.Motivo.Ans,
            diff: moment(actual).diff(moment(fechaSolicitud), 'minutes')
          }

          if (element.CreatedByID == login[0]._id && login[0].isCentral != 1) {
            color = '';
          }



          if (element.Activity) {
            color += ' apoyo';
          }

          element.color = color;

          let obj = {
            estado: element.CompanyStatus,
            fecha: {
              s: fechaSolicitud,
              o: '',
              d: ''
            },
            recibido: element.Received ? moment(element.Received).tz('America/Bogota').format('YYYY-MM-DD HH:mm') : '',
            motivo: element.Motivo.Name,
            origen: element.Origen.Name,
            destino: element.Destino.Name,
            camillero: element.AssignedTo,
            obscentral: obs2,
            obs: {
              paciente,
              recursos,
              aislado,
              obs
            },
            obs3: obs3,
            acc: element,
            token: element._id
          };

          if (exist >= 0) {
            fila[exist] = obj
          } else {
            fila.push(obj)
          }

        });
        data.response = data.response.filter((it) => it.CompanyStatus != 'PENDIENTE ASIGNACION CAMILLERO');
        data.response = this.order(data.response, 'UpdatedOn', true)
        let azules = [];
        data.response.forEach(element => {
          try {
            let fecha = element.JSONAnswers.filter((it) => it.apiId == 'FECHA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'FECHA')[0].Value : ''
            let hora = element.JSONAnswers.filter((it) => it.apiId == 'HORA').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'HORA')[0].Value : ''


            let paciente = element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'NOMBRE_PACIENTE')[0].Value : ''

            let recursos = element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'RECURSOS')[0].Value : ''

            let aislado = element.JSONAnswers.filter((it) => it.apiId == 'AISLADO').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'AISLADO')[0].Value : ''

            let obs = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES1')[0].Value : ''

            let obs2 = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES2').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES2')[0].Value : ''

            let obs3 = element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES3').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'OBSERVACIONES3')[0].Value : ''

            let org = element.JSONAnswers.filter((it) => it.apiId == 'FechallegaOrigen').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'FechallegaOrigen')[0].Value : ''

            let des = element.JSONAnswers.filter((it) => it.apiId == 'FechaLlegadaDestino').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'FechaLlegadaDestino')[0].Value : ''

            element.soporte = element.JSONAnswers.filter((it) => it.apiId == 'SOPORTE').length > 0 ? element.JSONAnswers.filter((it) => it.apiId == 'SOPORTE')[0].Value : ''

            let retorno = element.JSONAnswers.filter((item) => item.apiId == 'RECORRIDO').length > 0 
            ? element.JSONAnswers.filter((item) => item.apiId == 'RECORRIDO')[0].Value
            : [];

            if (retorno.length > 0) {
              console.log(retorno, 'RETORNO')


              retorno.forEach(ele => {
                  ele.date = moment(ele.date).tz('America/Bogota').format('YYYY-MM-DD HH:mm')
              });

              element.retorno = retorno;
            }

            let fechaSolicitud = fecha + ' ' + hora;

            let exist = fila.findIndex((it) => it.acc._id == element._id);

            let actual = org == '' ? moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm') : moment(org).tz('America/Bogota').format('YYYY-MM-DD HH:mm')

            let color: any = this.getColor(element.Motivo.Ans, fechaSolicitud, actual);

            element.info = {
              color,
              ans: element.Motivo.Ans,
              diff: moment(actual).diff(moment(fechaSolicitud), 'minutes')
            }

            if (element.CreatedByID == login[0]._id && login[0].isCentral != 1) {
              color = '';
            }




            if (element.Activity) {
              color += ' apoyo';
            }

            if (org) {
              color = '';
            }

            element.color = color;


            if (element.CompanyStatus == 'PENDIENTE ASIGNACION CAMILLERO') {
              element.estado = 'pending'
            } else if (element.CompanyStatus == 'SOLICITUD CON CAMILLERO') {
              element.estado = 'assigned'
            } else if (element.CompanyStatus == 'SOLICITUD CANCELADA POR DEMORA') {
              element.estado = 'demora'
            } else if (element.CompanyStatus == 'COMPLETADO') {
              element.estado = 'completado'
            }

            let obj = {
              estado: element.CompanyStatus,
              fecha: {
                s: fechaSolicitud,
                o: org ? moment(org).tz('America/Bogota').format('YYYY-MM-DD HH:mm') : '',
                d: des ? moment(des).tz('America/Bogota').format('YYYY-MM-DD HH:mm') : ''
              },
              recibido: element.Received ? moment(element.Received).tz('America/Bogota').format('YYYY-MM-DD HH:mm') : '',
              motivo: element.Motivo.Name,
              origen: element.Origen.Name,
              destino: element.Destino.Name,
              camillero: element.AssignedTo,
              obscentral: obs2,
              obs: {
                paciente,
                recursos,
                aislado,
                obs
              },
              obs3,
              acc: element,
              token: element._id,
              UpdatedOn: element.UpdatedOn
            };

            if (exist >= 0) {

              fila.splice(exist, 1)
              azules.push(obj)
            } else {
              azules.push(obj)
            }
          } catch (error) {

          }

        });

        azules = this.order(azules, 'UpdatedOn', true)


        azules.forEach((it) => fila.push(it))



        this.dataSource.data = fila;
        this.dataSource.paginator = this.paginator;
        this.loadActivities = true;

      })
    }

  }


  order(arr, param, desc?) {
    return arr.sort((a, b) => {

      if (moment(a[param]).format('YYYY-MM-DD HH:mm') > moment(b[param]).format('YYYY-MM-DD HH:mm')) {
        return desc ? -1 : 1;
      }

      if (moment(a[param]).format('YYYY-MM-DD HH:mm') < moment(b[param]).format('YYYY-MM-DD HH:mm')) {
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
          if (event.item.data) {
            const org = event.item.data.acc.JSONAnswers.filter((it) => it.apiId == 'FechallegaOrigen')

            if (org.length > 0) {
              this.toast.MsgError('No puede asignar una solicitud que ya tiene origen marcado');
              return;
            }

            if (event.item.data.acc.AssignedTo) {

              if (event.item.data.acc.AssignedTo._id == data._id) {
                this.toast.MsgOK('El camillero ya tiene esta solicitud asignada');
                return;
              }

              event.item.data.del = true;

            } else {
              if (event.item.data.acc.Activity) {
                if (event.item.data.acc.UpdatedByID == data._id) {
                  this.toast.MsgOK('No se puede asignar una solicitud de apoyo para el mismo camillero que lo solicitò');
                  return;
                }
              }
            }
          }
          this.assigment(data, event.item.data);
        }
      }
      console.log(event.item.data)
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
        if (data.del) {
          this.socket.deleteSolicitud({
            _id: data.acc.AssignedTo._id,
            solicitud: data.acc._id,
          })
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



  async deleteSolicitud(data) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar solicitud',
      message: 'Esta acciòn serà de forma permanente',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: async () => {

            this.deleteAction(data);

          }
        }
      ]
    })

    await alert.present();
  }

  async deleteAction(data) {
    const login = await this.stg.getLogin();

    if (login) {
      try {
        this.loading = true;
        const rs = await this.api.apiPost('DeletedActivity', {
          WorkZoneID: login[0].WorkZone,
          _id: data._id,
          token: login[0].token
        })



        if (!rs.status) {
          this.toast.MsgError(rs.err);
          this.loading = false;
          return;
        }

        if (rs.response.AssignedTo) {
          this.socket.deleteSolicitud({
            _id: rs.response.AssignedTo._id,
            solicitud: data._id
          })
        }



        this.filter = true;

        this.getSolicitudes();

        this.toast.MsgOK('Solicitud Eliminada')

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

    this.stop = false;
  }

  ca(event) {
    this.isAdmin = event.detail.checked;
    this.stop = false;
    this.filter = true;
    this.getUsers();
    this.getSolicitudes()
  }

  status(event) {
    this.isAllStatus = event.detail.checked;
    this.filter = true;
    this.getSolicitudes()
  }

  async history(user) {
    const modal = await this.modalCtrl.create({
      component: HistoryComponent,
      cssClass: 'maxContent',
      componentProps: {
        hidden: true,
        id: user._id,
        user: user.FirstName + ' ' + user.LastName
      }
    })

    await modal.present();
  }
  async detail(data) {
    const modal = await this.modalCtrl.create({
      component: DetailComponent,
      cssClass: '',
      componentProps: {
       data
      }
    })

    await modal.present();

    this.stop = false;
  }

  async markOrg(title,api, id) {

    const alert = await this.alertCtrl.create({
      header: 'Marcar ' + title,
      message: '¿Està seguro de marcar ' + title + ' para esta solicitud ?',
      buttons: [
        {
          text: 'cancelar'
        },
        {
          text: 'Aceptar',
          handler: async () => {
            const login = await this.stg.getLogin();

            if (login) {

              this.loading = true;


              try {

                const dates = await this.api.getDate({
                  token: login[0].token,
                  format: 'America/Bogota'
                })

                this.loading = true;
                const rs = await this.api.apiPost('EditFields', {
                  WorkZoneID: login[0].WorkZone,
                  api: api,
                  value: dates.utc,
                  valueUTC: dates.utc,
                  _id: id,
                  CompanyStatus: title == 'origen' ? 'SOLICITUD CON CAMILLERO' : 'COMPLETADO',
                  token: login[0].token
                })

        
                if (!rs.status) {
                  this.toast.MsgError(rs.err)
                  return;
                }

                console.log(rs)

                this.toast.MsgOK('Proceso ejecutado correctamente')

                this.filter = true;
                this.loading = true;
                
                this.getSolicitudes();

              } catch (error) {
                this.loading = true;
                this.toast.MsgError('No se pudo realizar la solicitud')
              }

            }
          }
        }
      ]
    })

    await alert.present();

  }


  async obsCentral(desc, id) {

    const alert = await this.alertCtrl.create({
      header: 'Enviar Observaciones',
      message: 'Escriba un comentario',
      inputs: [
        {
          type: 'textarea',
          value: desc,
          name: 'obs'
        }
      ],
      buttons: [
        {
          text: 'cancelar'
        },
        {
          text: 'Aceptar',
          handler: async (data) => {
            const login = await this.stg.getLogin();

            if (login) {

              this.loading = true;


              try {

                const dates = await this.api.getDate({
                  token: login[0].token,
                  format: 'America/Bogota'
                })

                this.loading = true;
                const rs = await this.api.apiPost('EditFields', {
                  WorkZoneID: login[0].WorkZone,
                  api: 'OBSERVACIONES2',
                  value: data.obs,
                  valueUTC: dates.utc,
                  _id: id,
                  CompanyStatus: 'SOLICITUD CON CAMILLERO' ,
                  token: login[0].token
                })

        
                if (!rs.status) {
                  this.toast.MsgError(rs.err)
                  return;
                }

       
                this.toast.MsgOK('Proceso ejecutado correctamente')

                this.filter = true;
                this.loading = true;
                
                this.getSolicitudes();

              } catch (error) {
                this.loading = true;
                this.toast.MsgError('No se pudo realizar la solicitud')
              }

            }
          }
        }
      ]
    })

    await alert.present();

  }

  load() {
    this.stop = false;
    this.filter = true;
    this.getSolicitudes()
  }

  filterUsers(event) {
    console.log('Hola', event)
    this.users2 = [];
    if (event.target.value == '') {
      this.users2 = this.users;
      return;
    }
    this.users2 = this.users.filter((it) => {
      let name = it.FirstName.toLowerCase() + ' ' + it.LastName.toLowerCase()

      return name.includes(event.target.value.toLowerCase())
    })
  }

  filterClear() {
    this.users2 = this.users;
  }

  ionViewWillLeave() {
    if (this.interval) {
      //  clearInterval(this.interval);
    }
    this.mot.writeValue('');
    this.org.writeValue('');
    this.des.writeValue('');
    this.motivoSelect = false;
    this.origenSelec = false;
    this.DestinoSelect = false;
    this.fechaFrom = '';
    this.fechaTo = '';
    this.fromTemp = '';
    this.toTemp = '';
    this.filter = true;
    this.isAllStatus = false;
    this.isFilter = false;

    this.myForm.controls['from'].setValue('');
    this.myForm.controls['to'].setValue('');
    this.dataSource.data = [];

  }

}
