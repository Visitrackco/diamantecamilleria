import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'

import { AlertController, ModalController } from '@ionic/angular';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HistoryComponent } from 'src/app/Components/history/history.component';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ObserverService } from 'src/app/Services/observer.service';
import { DetailComponent } from 'src/app/Components/detail/detail.component';
import * as XLSX from "xlsx";


@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.page.html',
  styleUrls: ['./tabla.page.scss'],
})
export class TablaPage implements OnInit {

  titles = [{ id: 'token', name: 'TOKEN' },
  { id: 'estado', name: 'ESTADO' },
  { id: 'motivo', name: 'MOTIVO' },
  { id: 'origen', name: 'ORIGEN' },
  { id: 'destino', name: 'DESTINO' },
  { id: 'solicitado', name: 'SOLICITADO POR' },
  { id: 'camillero', name: 'CAMILLERO' },
  { id: 'obscentral', name: 'OBSERVACION DE LA CENTRAL' },
  { id: 'obsadicional', name: 'OBSERVACIONES ADICIONALES' },
  { id: 'obssolicitante', name: 'OBSERVACION DEL SOLICITANTE' },

  { id: 'paciente', name: 'NOMBRE PACIENTE' },
  { id: 'recursos', name: 'RECURSOS NECESARIOS' },
  { id: 'creacion', name: 'CREACION SOLICITUD FECHA Y HORA' },
  { id: 'solicitud', name: 'SOLICITUD FECHA Y HORA' },
  { id: 'asignacion', name: 'ASIGNACION CAMILLERO FECHA Y HORA' },
  { id: 'llegadao', name: 'LLEGADA ORIGEN FECHA Y HORA' },
  { id: 'llegadad', name: 'LLEGADA DESTINO FECHA Y HORA' },
  { id: 'iespera', name: 'INICIO ESPERA FECHA Y HORA' },
  { id: 'fespera', name: 'FIN ESPERA FECHA Y HORA' },
  { id: 'creacionf', name: 'CREACION FECHA' },
  { id: 'creacionh', name: 'CREACION HORA' },
  { id: 'solicitudf', name: 'SOLICITUD FECHA' },
  { id: 'solicitudh', name: 'SOLICITUD HORA' },
  { id: 'asignacionf', name: 'ASIGNACION CAMILLERO FECHA' },
  { id: 'asignacionh', name: 'ASIGNACION CAMILLERO HORA' },
  { id: 'llegadaof', name: 'LLEGADA ORIGEN FECHA' },
  { id: 'llegadaoh', name: 'LLEGADA ORIGEN HORA' },
  { id: 'llegadadf', name: 'LLEGADA DESTINO FECHA' },
  { id: 'llegadadh', name: 'LLEGADA DESTINO HORA' },
  { id: 'iesperaf', name: 'INICIO DE ESPERA FECHA' },
  { id: 'iesperah', name: 'INICIO DE ESPERA HORA' },
  { id: 'fesperaf', name: 'FIN DE ESPERA FECHA' },
  { id: 'fesperah', name: 'FIN DE ESPERA HORA' },
  { id: 'demora', name: 'MOTIVO DEMORA' },
  { id: 'hospital', name: 'HOSPITAL' },
  { id: 'obscamillero', name: 'OBSERVACIONES CAMILLERO' },
  { id: 'calificacion', name: 'CALIFICACION' },
  { id: 'apoyo', name: 'APOYO' },
  { id: 'retorno', name: 'RETORNO' },

  ]

  displayedColumns = [];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  @ViewChild('ipt') ipt: ElementRef;

  loadActivities;
  clickUsers;

  loading;

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

  load;

  IsDeleted = false;




  myForm: FormGroup<any>;
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

  }




  exportTableToExcel() {

    let newArr = [];

    this.dataSource.data.forEach((it) => {
      let obj = {};
      for (const key in it) {

        let idx = this.titles.findIndex((item) => item.id == key)

        if (idx >= 0) {
          obj[this.titles[idx].name] = it[key]
        }


      }

      newArr.push(obj)
    })

    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet(newArr, { cellStyles: true });
    XLSX.utils.book_append_sheet(wb, ws, 'Mi data');
    XLSX.writeFile(wb, `Actividades.xlsx`);
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


      this.load = true;

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

  ca(event) {
    this.isAdmin = event.detail.checked;
    this.stop = false;
    this.filter = true;
    this.getSolicitudes()
  }


  clear() {
    this.stop = false;

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
    //  this.getSolicitudes();
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

  getField(arr, api) {
    return arr.filter((item) => item.apiId == api).length > 0 ? arr.filter((item) => item.apiId == api)[0].Value : ''
  }

  status(event) {
    this.IsDeleted = event.detail.checked;
    this.filter = true;
    if (this.myForm.controls['from'].value && this.myForm.controls['to'].value) {
      this.getSolicitudes();
    }
  }

  async getSolicitudes() {
    this.stop = false;

    const login = await this.stg.getLogin();

    this.loadActivities = false;

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
        IsDeleted: this.IsDeleted,
        isAllStatus: 1
      }).then((data: any) => {

        this.filter = false;
        this.loading = false;

        if (!data.status) {
          this.toast.MsgError(data.err);
          this.loadActivities = true;
          return;
        }


        console.log(data)
        let fila = [...this.dataSource.data];

        let dataConvert = [];

        // https://www.linkedin.com/in/lore-devf/

        let countRetornos = [];
        data.response.forEach(element => {
          let rec = this.getField(element.JSONAnswers, 'RECORRIDO');

          if (rec) {
            try {

              countRetornos.push(rec.length)
            } catch (error) {

            }
          }

          const custom = element.JSONAnswers.filter((l) => l.apiId.includes('CUSTOMAPI'))
          console.log(custom.reverse())

          custom.reverse().forEach(c => {

            let idx = this.titles.findIndex((it) => it.id == c.apiId.toString().toLowerCase())
            let idxStart = this.titles.findIndex((it) => it.id == 'origen')


            if (idx < 0) {
              this.titles.splice((idxStart),0,{
                id: c.apiId.toString().toLowerCase(),
                name: c.title
              })
            }
          });

        })

        console.log(this.titles)



        countRetornos = countRetornos.sort().reverse();

        let CountTotal = countRetornos.length > 0 ? countRetornos[0] : 0




        for (let i = 1; i <= CountTotal; i++) {
          let idx = this.titles.findIndex((it) => it.id == 'retorno' + i)

          if (idx < 0) {
            this.titles.push({
              id: 'retorno' + i,
              name: 'RETORNO ' + i
            }, {
              id: 'destinor' + i,
              name: 'DESTINO ' + i
            }, {
              id: 'fechar' + i,
              name: 'FECHA ' + i
            }, {
              id: 'tecr' + i,
              name: 'TECNOLOGIA ' + i
            })
          }


        }






        let idxo = this.titles.findIndex((l) => l.id == 'tecorigen');
        let idxd = this.titles.findIndex((l) => l.id == 'tecdestino');

        if (idxo < 0) {
          this.titles.push({
            id: 'tecorigen',
            name: 'TECNOLOGIA ORIGEN'
          })
        }

        if (idxd < 0) {
          this.titles.push({
            id: 'tecdestino',
            name: 'TECNOLOGIA DESTINO'
          })
        }



        let idx1 = this.titles.findIndex((l) => l.id == 'nombreinsumo');
        let idx2 = this.titles.findIndex((l) => l.id == 'nomsoli');
        let idx3 = this.titles.findIndex((l) => l.id == 'cargosoli');

        if (idx1 < 0) {
          this.titles.push({
            id: 'nombreinsumo',
            name: 'NOMBRE INSUMO'
          })
        }

        if (idx2 < 0) {
          this.titles.push({
            id: 'nomsoli',
            name: 'NOMBRE SOLICITANTE INSUMO'
          })
        }

        if (idx3 < 0) {
          this.titles.push({
            id: 'cargosoli',
            name: 'CARGO SOLICITANTE INSUMO'
          })
        }




        let idx = this.titles.findIndex((l) => l.id == 'eliminadapor');

        if (!this.IsDeleted) {
          //  this.titles.splice(idx, 1)
        }

        if (idx < 0 && this.IsDeleted) {
          this.titles.push({
            id: 'eliminadapor',
            name: 'ELIMINADA POR '
          }, {
            id: 'eliminadaen',
            name: 'ELIMINADA EN '
          })
        }






        let claves = this.titles.map((item) => item.id);

        this.displayedColumns = claves;





        data.response.forEach(element => {


          let obj = {
            'token': element._id,
            'estado': element.CompanyStatus,
            'motivo': element.Motivo.Name,
            'origen': element.Origen.Name,
            'destino': element.Destino.Name,
            'solicitado': this.getField(element.JSONAnswers, 'NOMBRE'),
            'camillero': element.AssignedTo ? element.AssignedTo.FirstName + ' ' + element.AssignedTo.LastName : '',
            'obscentral': this.getField(element.JSONAnswers, 'OBSERVACIONES2'),
            'obsadicional': this.getField(element.JSONAnswers, 'OBSERVACIONES1'),
            'obssolicitante': this.getField(element.JSONAnswers, 'OBSERVACIONES4'),

            'paciente': this.getField(element.JSONAnswers, 'NOMBRE_PACIENTE'),
            'recursos': this.getField(element.JSONAnswers, 'RECURSOS') != '' ? this.getField(element.JSONAnswers, 'RECURSOS').join(',') : '',
            'creacion': moment(element.CreatedOn).tz('America/Bogota').format('YYYY-MM-DD HH:mm'),
            'solicitud': this.getField(element.JSONAnswers, 'FECHA') + ' ' + this.getField(element.JSONAnswers, 'HORA'),
            'asignacion': moment(element.AssignedOn).tz('America/Bogota').format('YYYY-MM-DD HH:mm'),
            'llegadao': !this.getField(element.JSONAnswers, 'FechallegaOrigen') ? '' : moment(this.getField(element.JSONAnswers, 'FechallegaOrigen')).tz('America/Bogota').format('YYYY-MM-DD HH:mm'),
            'llegadad': !this.getField(element.JSONAnswers, 'FechaLlegadaDestino') ? '' : moment(this.getField(element.JSONAnswers, 'FechaLlegadaDestino')).tz('America/Bogota').format('YYYY-MM-DD HH:mm'),
            'iespera': !this.getField(element.JSONAnswers, 'Espera') ? '' : moment(this.getField(element.JSONAnswers, 'Espera')).tz('America/Bogota').format('YYYY-MM-DD HH:mm'),
            'fespera': !this.getField(element.JSONAnswers, 'Esperafin') ? '' : moment(this.getField(element.JSONAnswers, 'Esperafin')).tz('America/Bogota').format('YYYY-MM-DD HH:mm'),
            'creacionf': moment(element.CreatedOn).tz('America/Bogota').format('YYYY-MM-DD'),
            'creacionh': moment(element.CreatedOn).tz('America/Bogota').format('HH:mm'),
            'solicitudf': this.getField(element.JSONAnswers, 'FECHA'),
            'solicitudh': this.getField(element.JSONAnswers, 'HORA'),
            'asignacionf': moment(element.AssignedOn).tz('America/Bogota').format('YYYY-MM-DD'),
            'asignacionh': moment(element.AssignedOn).tz('America/Bogota').format('HH:mm'),
            'llegadaof': !this.getField(element.JSONAnswers, 'FechallegaOrigen') ? '' : moment(this.getField(element.JSONAnswers, 'FechallegaOrigen')).tz('America/Bogota').format('YYYY-MM-DD'),
            'llegadaoh': !this.getField(element.JSONAnswers, 'FechallegaOrigen') ? '' : moment(this.getField(element.JSONAnswers, 'FechallegaOrigen')).tz('America/Bogota').format('HH:mm'),
            'llegadadf': !this.getField(element.JSONAnswers, 'FechaLlegadaDestino') ? '' : moment(this.getField(element.JSONAnswers, 'FechaLlegadaDestino')).tz('America/Bogota').format('YYYY-MM-DD'),
            'llegadadh': !this.getField(element.JSONAnswers, 'FechaLlegadaDestino') ? '' : moment(this.getField(element.JSONAnswers, 'FechaLlegadaDestino')).tz('America/Bogota').format('HH:mm'),
            'iesperaf': !this.getField(element.JSONAnswers, 'Espera') ? '' : moment(this.getField(element.JSONAnswers, 'Espera')).tz('America/Bogota').format('YYYY-MM-DD'),
            'iesperah': !this.getField(element.JSONAnswers, 'Espera') ? '' : moment(this.getField(element.JSONAnswers, 'Espera')).tz('America/Bogota').format('HH:mm'),
            'fesperaf': !this.getField(element.JSONAnswers, 'Esperafin') ? '' : moment(this.getField(element.JSONAnswers, 'Esperafin')).tz('America/Bogota').format('YYYY-MM-DD'),
            'fesperah': !this.getField(element.JSONAnswers, 'Esperafin') ? '' : moment(this.getField(element.JSONAnswers, 'Esperafin')).tz('America/Bogota').format('HH:mm'),
            'demora': this.getField(element.JSONAnswers, 'DEMORA'),
            'hospital': element.WorkZoneID == 6842 ? 'HOSPITAL MEDELLIN' : 'HOSPITAL RIONEGRO',
            'obscamillero': this.getField(element.JSONAnswers, 'OBSERVACIONES3'),
            'calificacion': '',
            'apoyo': this.getField(element.JSONAnswers, 'ADICIONAL') ? 'SI' : 'NO',
            'retorno': this.getField(element.JSONAnswers, 'RECORRIDO') ? 'SI' : 'NO'
          };

          let rec = this.getField(element.JSONAnswers, 'RECORRIDO') ? this.getField(element.JSONAnswers, 'RECORRIDO') : [];


          for (let i = 0; i < rec.length; i++) {
            try {
              obj['retorno' + (i + 1)] = rec[i].mov;
              obj['destinor' + (i + 1)] = rec[i].tag;
              obj['fechar' + (i + 1)] = moment(rec[i].date).tz('America/Bogota').format('YYYY-MM-DD HH:mm');
              obj['tecr' + (i + 1)] = rec[i].tec;

            } catch (error) {
              obj['retorno' + (i + 1)] = '';
              obj['destinor' + (i + 1)] = '';
              obj['fechar' + (i + 1)] = '';
              obj['tecr' + (i + 1)] = '';

            }
          }

          const custom = element.JSONAnswers.filter((l) => l.apiId.includes('CUSTOMAPI'))

          custom.forEach(c => {
            obj[c.apiId.toString().toLowerCase()] = c.Value

          });

          obj['eliminadapor'] = element.DeletedBy ? element.DeletedBy.FirstName + ' ' + element.DeletedBy.LastName : ''
          obj['eliminadaen'] = element.DeletedBy ? moment(element.DeletedOn).tz('America/Bogota').format('YYYY-MM-DD HH:mm') : ''


          obj['tecorigen'] = this.getField(element.JSONAnswers, 'TECORIGEN')
          obj['tecdestino'] = this.getField(element.JSONAnswers, 'TECDESTINO')
          obj['nombreinsumo'] = this.getField(element.JSONAnswers, 'NOMBREINSUMO')
          obj['nomsoli'] = this.getField(element.JSONAnswers, 'NOMSOLI')
          obj['cargosoli'] = this.getField(element.JSONAnswers, 'CARGOSOLI')




          fila.push(obj)


        });




        this.dataSource.data = fila;
        this.dataSource.paginator = this.paginator;
        this.loadActivities = true;

      })
    }

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
