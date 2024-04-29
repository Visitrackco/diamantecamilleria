import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDatepicker, MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import * as moment from 'moment-timezone';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

@Component({
  selector: 'app-form-pruebas',
  templateUrl: './form-pruebas.page.html',
  styleUrls: ['./form-pruebas.page.scss'],
})
export class FormPruebasPage implements OnInit {

  isClick;

  loadInfo = false;


  myForm: FormGroup<any>;

  isPaciente;
  isInsumos;

  motivosList = [];

  dateServer;
  timeServer;
  timeServerTemp;

  saving;

  recursos = [];

  constructor(
    private fb: FormBuilder,
    private menuCtrl: MenuController,
    private api: ApiService,
    private stg: StorageWebService,
    private socket: SocketService,
    private toast: ToastService,
    private router: Router
  ) {

    this.socket.newActivityOn().subscribe({
      next: (data) => {
        console.log(data, 'CALIS')
        const audio = new Audio('/assets/notification.mp3')
        audio.play()

      },
      error: (err) => console.error(err)
    })
  }

  locations: any[] = [

  ];

  selectedStates = this.locations;
  selectedStates2 = this.locations;

  invalid;

  ionViewWillEnter() {
    this.loadForm()
    this.menuCtrl.enable(true, 'menu')
    this.getLocation()
  }

  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    console.log(event.value)
    console.log()

    let from = moment(this.dateServer).format('YYYY-MM-DD');
    let to = moment(new Date(event.value).toISOString()).format('YYYY-MM-DD');
    let diff = moment(to).diff(moment(from), 'days')
    if (diff > 0) {
      this.timeServer = '00:00'
    } else {
      this.timeServer = this.timeServerTemp
    }
  }

  async getLocation() {
    const login = await this.stg.getLogin();

    if (login) {

      this.myForm.controls['solicita'].setValue(login[0].FirstName + ' ' + login[0].LastName)

      this.api.getDate({
        token: login[0].token,
        format: 'America/Bogota'
      }).then((server) => {
        this.myForm.controls['fecha'].setValue(server.date)
        this.dateServer = server.date

        this.myForm.controls['hora'].setValue(server.time)
        this.timeServer = server.time
        this.timeServerTemp = server.time

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

            this.api.apiGet('recurso?WorkZoneID=' + login[0].WorkZone, login[0].token).then((rec) => {

              this.recursos = rec.response;
              this.loadInfo = true;
            })



          })


        })
      })


    }


  }

  onKey(value) {

    this.selectedStates = this.search(value.target.value);
  }

  onKey2(value) {

    this.selectedStates2 = this.search(value.target.value);
  }

  search(value: any) {

    let filter = value.toLowerCase();

    return this.locations.filter(option => {

      let name = option.Name.toLowerCase()
      return name.includes(filter)
    });
  }

  ngOnInit() {


  }

  loadForm() {
    this.myForm = this.fb.group({
      fecha: new FormControl('', [
        // validaciones síncronas
        Validators.required

      ]),
      hora: new FormControl('', [
        // validaciones síncronas
        Validators.required

      ]),
      solicita: new FormControl('', [
        // validaciones síncronas
        Validators.required

      ]),
      origen: new FormControl('', [
        // validaciones síncronas
        Validators.required

      ]),
      destino: new FormControl('', [
        // validaciones síncronas
        Validators.required

      ]),
      motivos: new FormControl('', [
        // validaciones síncronas
        Validators.required

      ]),
      nombrepac: new FormControl('', [
        // validaciones síncronas



      ]),
      recurso: new FormArray([], [
        // validaciones síncronas

      ]),
      aislado: new FormControl('', [
        // validaciones síncronas


      ]),
      obs: new FormControl('', [
        // validaciones síncronas


      ]),
      nominsumo: new FormControl('', [
        // validaciones síncronas



      ]),
      nomsoli: new FormControl('', [
        // validaciones síncronas



      ]),
      cargosoli: new FormControl('', [
        // validaciones síncronas



      ]),
    });
  }


  timeChanged(event) {


    // this.myForm.controls['hora'].setValue(hora)
  }

  async doSomething() {

    let login = await this.stg.getLogin();


    this.isClick = true;
    console.log(this.myForm.controls['recurso']['value'], 'recursos')


    let isValid = false;
    if (this.isPaciente) {
      if (this.myForm.controls['nombrepac']['value'] == '') {
        this.invalid = true;
        return;

      }
      if (this.myForm.controls['aislado']['value'] == '') {
        this.invalid = true;
        return;

      }
      if (this.myForm.controls['recurso']['value'].length == 0) {
        this.invalid = true;
        return;


      }


      if (this.myForm.status == 'VALID') {
        isValid = true;
      }
    } else {
      if (this.myForm.status == 'VALID') {
        isValid = true;
        console.log('hola')
      } else {
        console.log('aqui')
      }
    }

    if (isValid) {

      this.api.getDate({
        token: login[0].token,
        format: 'America/Bogota'
      }).then(async (server) => {
        let fecha = moment(this.myForm.controls['fecha']['value']).format('YYYY-MM-DD');
        let hora = this.myForm.controls['hora']['value']
        let dateOld = moment(fecha + ' ' + hora).format('YYYY-MM-DD HH:mm')
        let dateNew = moment(server.date).format('YYYY-MM-DD HH:mm')


        let diff = moment(dateNew).diff(moment(dateOld), 'minutes')

        if (diff >= 0) {
          this.myForm.controls['fecha'].setValue(server.date)
          this.dateServer = server.date

          this.myForm.controls['hora'].setValue(server.time)
          this.timeServer = server.time;
          this.timeServerTemp = server.time;
        }



        this.saving = true;
        let json = [{
          apiId: 'FECHA',
          Value: moment(this.myForm.controls['fecha']['value']).format('YYYY-MM-DD')
        }, {
          apiId: 'HORA',
          Value: this.myForm.controls['hora']['value']
        }, {
          apiId: 'NOMBRE',
          Value: this.myForm.controls['solicita']['value']
        }, {
          apiId: 'TORREPISO_ORG',
          Value: this.myForm.controls['origen']['value']['Torre'] + '|' + this.myForm.controls['origen']['value']['Piso']
        }, {
          apiId: 'HOSPITAL',
          Value: 'HOSPITAL DE MEDELLIN'
        }, {
          apiId: 'ORIGEN_MEDELLIN',
          Value: this.myForm.controls['origen']['value']['Name']
        }, {
          apiId: 'DESTINO_MEDELLIN',
          Value: this.myForm.controls['destino']['value']['Name']
        }, {
          apiId: 'MOTIVOS_MEDELLIN',
          Value: this.myForm.controls['motivos']['value']
        }, {
          apiId: 'NOMBRE_PACIENTE',
          Value: this.myForm.controls['nombrepac']['value']
        }, {
          apiId: 'RECURSOS',
          Value: this.myForm.controls['recurso']['value']
        }, {
          apiId: 'AISLADO',
          Value: this.myForm.controls['aislado']['value']
        }, {
          apiId: 'OBSERVACIONES1',
          Value: this.myForm.controls['obs']['value']
        }, {
          apiId: 'NOMBREINSUMO',
          Value: this.myForm.controls['nominsumo']['value']
        }, {
          apiId: 'NOMSOLI',
          Value: this.myForm.controls['nomsoli']['value']
        }, {
          apiId: 'CARGOSOLI',
          Value: this.myForm.controls['cargosoli']['value']
        }]

        console.log(json)



        if (login) {

          let fecha = moment(this.myForm.controls['fecha']['value']).format('YYYY-MM-DD');

          try {
            const create = await this.api.CreateActivity({
              WorkZoneID: login[0].WorkZone,
              json,
              date: moment(fecha + ' ' + this.myForm.controls['hora']['value']).format('YYYY-MM-DD HH:mm'),
              token: login[0].token,
              Motivo: this.myForm.controls['motivos']['value']._id,
              Origen: this.myForm.controls['origen']['value']._id,
              Destino: this.myForm.controls['destino']['value']._id,
              Format: 'America/Bogota'
            })

            console.log(create)



            if (create.status) {
              create.response.future = create.future;
              if (create.response.isAdmin == 1) {
                this.socket.newActivity(login[0].WorkZone + 'centraladmin', create.response)
              } else {
                this.socket.newActivity(login[0].WorkZone + 'central', create.response)
              }

              this.isClick = false;

              this.myForm.reset()

              this.router.navigate(['/dashboard'])

              this.saving = false;

            } else {
              this.saving = false;
              this.toast.MsgError(create.err)
            }
          } catch (error) {
            this.saving = false;
            ///  this.toast.MsgError(error)
          }
        }

      }).catch((err) => {
        this.toast.MsgError('No se pudo guardar la fecha para la solicitud, recargue el formulario nuevamente')
      })





    } else {
      this.saving = false;
    }

    console.log(isValid, 'VALID')
  }


  changeMot(event) {
    if (event.detail.value.Name == 'TRANSPORTAR PACIENTE') {
      this.isPaciente = true;
      if (this.myForm.controls['recurso']['value'].length == 0) {
        this.invalid = true;
      }

    } else {



      this.isPaciente = false;
    }





    if (event.detail.value.Name == 'TRANSPORTE DE INSUMOS LABORATORIO CLINICO') {
      this.isInsumos = true;
      if (this.myForm.controls['nominsumo']['value'] == '') {
        this.myForm.controls['nominsumo'].addValidators([Validators.required])
        this.invalid = true;
      }

      if (this.myForm.controls['nomsoli']['value'] == '') {
        this.myForm.controls['nomsoli'].addValidators([Validators.required])
        this.invalid = true;
      }

      if (this.myForm.controls['cargosoli']['value'] == '') {
        this.myForm.controls['cargosoli'].addValidators([Validators.required])
        this.invalid = true;
      }
      if (this.myForm.controls['nombrepac']['value'] == '') {
        this.myForm.controls['nombrepac'].addValidators([Validators.required])
        this.invalid = true;
      }

    } else {



      this.isInsumos = false;
    }
  }

  change(event) {
    let rec = this.myForm.value.recurso.filter((item) => item == event.detail.value)



    if (rec.length > 0) {
      if (!event.detail.checked) {
        let idx = this.myForm.value.recurso.findIndex((item) => item == event.detail.value)

        this.myForm.value.recurso.splice(idx, 1)
      }

      return;
    }


    this.myForm.value.recurso.push(event.detail.value);
  }


}

