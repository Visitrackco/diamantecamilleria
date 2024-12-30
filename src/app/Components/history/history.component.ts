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
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {

  displayedColumns =
    ['estado', 'fecha', 'solicitud', 'agente'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  @Input() id;
  @Input() hidden;
  @Input() user;

  @Input() descanso;

  loadActivities;


  loading;
  myForm: FormGroup;

  ItemsDescansos = {
    desayuno: false,
    almuerzo: false,
    cena: false,
    libre: false
  }


  ItemsDescansosMin = {
    desayuno: 0,
    almuerzo: 0,
    cena: 0,
    libre: 0
  }

  validation = false;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController,
    private router: Router,
    private activate: ActivatedRoute,
    private fb: FormBuilder,
    private modalCtrl: ModalController
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



          this.dataSource.data = fila;
        }
      }
    })

  }



  async ngOnInit() {
    console.log(this.id, 'IDDDDDD', this.hidden)

    const login = await this.stg.getLogin();

    if (login) {


      this.myForm = this.fb.group({
        desayunomin: new FormControl('', [Validators.required]),

        almuerzomin: new FormControl('', [Validators.required]),

        cenamin: new FormControl('', [Validators.required]),

        libremin: new FormControl('', [Validators.required]),

        itemdesc: new FormControl('', [])

      })

      this.getHistory();

    }

  }

  async ionViewWillEnter() {


  }

  async getHistory() {
    moment.locale('es')
    const login = await this.stg.getLogin();

    if (login) {
      try {

        const config = await this.api.apiGet('descansos/byuser?userID=' + this.id + '&zone=' + login[0].WorkZone, login[0].token)

        console.log(config , 'config');

        if (!config.status) {
          this.descanso = false;
          this.toast.MsgOK('Los descansos para este usuario no estàn configurados, por favor comuniquese con el usuario administrador para su configuraciòn.')
          this.modalCtrl.dismiss()
          return;
        } else {
          this.myForm.controls['desayunomin'].setValue(config.response.Desayuno.minutes) 
          this.myForm.controls['almuerzomin'].setValue(config.response.Almuerzo.minutes) 
          this.myForm.controls['cenamin'].setValue(config.response.Cena.minutes) 
          this.myForm.controls['libremin'].setValue(config.response.Libre.minutes) 

          if (config.response.EstadoDesc) {
            this.ItemsDescansos[config.response.EstadoDesc.name] = true;
            this.myForm.controls['itemdesc'].setValue(config.response.EstadoDesc.name) 
          }
        }

        this.dataSource.data = [];
        const rs = await this.api.apiGet('sessionUser?_id=' + this.id, login[0].token)

        if (rs) {
          console.log(rs)
          let fila = [...this.dataSource.data];
          rs.response.forEach(element => {
            let obj = {
              estado: element.Mode,
              fecha: moment(element.DateSession).tz('America/Bogota').format('LLLL'),
              solicitud: element.Solicitud,
              agente: element.Agent

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


  history(row) {
    this.router.navigate(['/historial', row.name._id])
  }

  toogleItemDesc(event, item) {
    this.myForm.controls['itemdesc'].setValue(event.detail.value)

    for (const key in this.ItemsDescansos) {
      if (key != item) {
        this.ItemsDescansos[key] = false;
      }  else {
        this.ItemsDescansos[key] = event.detail.checked;
      }
    }
  }

  async saveDesc() {
    if (this.myForm.invalid) {
      this.validation = true;
      return;
    }
    this.validation = false;

    const item = Object.keys(this.ItemsDescansos).filter((l) => this.ItemsDescansos[l])

    console.log(item, 'item')

    const login = await this.stg.getLogin();

    if (login) {
      try {

        const canMarkDesc = await this.api.apiGet('userassigments?userID=' + this.id + '&WorkZoneID=' + login[0].WorkZone, login[0].token)

        console.log(canMarkDesc , 'canMarkDesc');

        if (!canMarkDesc.status) {
          this.toast.MsgError('Error al marcar el descanso, no se pudo consultar las solicitudes del usuario')
          return;
        } 

        if (canMarkDesc.response > 0) {
          this.toast.MsgError('El camillero tiene solicitudes pendientes, no puede marcar descanso')
          return;
        } 

        const rs = await this.api.apiPost('descansos/mark', {
          zone: login[0].WorkZone,
          userID: this.id,
          Desayuno: {
            minutes: this.myForm.controls['desayunomin'].value,
          //  time: this.myForm.controls['desayunotime'].value
          },
          Almuerzo: {
            minutes: this.myForm.controls['almuerzomin'].value,
          //  time: this.myForm.controls['almuerzotime'].value
          },
          Cena: {
            minutes: this.myForm.controls['cenamin'].value,
           // time: this.myForm.controls['cenatime'].value
          },
          Libre: {
            minutes: this.myForm.controls['libremin'].value,
          //  time: this.myForm.controls['libretime'].value
          },
          token: login[0].token,
          EstadoDesc: item.length > 0 ? {
            name: item[0],
            min: this.myForm.controls[item[0].toLowerCase() +'min'].value
          } : false
        })

        if (rs.status) {
          this.modalCtrl.dismiss({reload: true})
        }

      } catch (error) {

      }
    }


   
  }

}
