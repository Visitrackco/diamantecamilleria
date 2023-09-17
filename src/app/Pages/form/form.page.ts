import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MenuController } from '@ionic/angular';
import * as moment from 'moment-timezone';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],

})
export class FormPage implements OnInit {


  isClick;

  loadInfo = false;


  myForm: FormGroup<any>;

  isPaciente;

  motivos = [];

  constructor(
    private fb: FormBuilder,
    private menuCtrl: MenuController,
    private api: ApiService,
    private stg: StorageWebService
  ) { }

  locations: any[] = [
 
  ];

selectedStates = this.locations; 

invalid;

ionViewWillEnter() {
  this.menuCtrl.enable(true, 'menu')
  this.getLocation()
}

async getLocation() {
  const login = await this.stg.getLogin();

  if (login) {

    this.api.getLocationByZone({
      WorkZoneID: login[0].WorkZone
    }).then((rs) => {
    
      this.locations = rs.response;
      this.selectedStates = this.locations;
  
      this.api.getWMotivos({
        WorkZoneID: login[0].WorkZone
      }).then((rsMotivo) => {
        this.motivos = rsMotivo.response;
        this.loadInfo = true;
      })
  
   
    })
  

  }
 

}

onKey(value) { 
  console.log(value)
this.selectedStates = this.search(value.target.value);
}

search(value: any) { 

  let filter = value.toLowerCase();

  return this.locations.filter(option => {

    let name = option.Name.toLowerCase()
    return name.includes(filter)
  });
}

  ngOnInit() {

    this.myForm = this.fb.group({
      fecha: new FormControl(moment().tz('America/Bogota').toISOString(), [
        // validaciones síncronas
        Validators.required
 
      ]),
      hora: new FormControl(moment().tz('America/Bogota').format('HH:mm'), [
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

 
      ])
    });
  }

  doSomething() {
    this.isClick = true;
    console.log(this.myForm.controls['recurso'])
    let isValid = false;
    if (this.isPaciente) {
      if (this.myForm.controls['recurso']['value'].length == 0) {
        this.invalid = true;
      } else {
        if (this.myForm.status == 'VALID') {
          isValid = true;
        }
      }
    } else {
      if (this.myForm.status == 'VALID') {
        isValid = true;
      }
    }

    console.log(isValid)
  }

  changeMot(event) {
    if (event.detail.value.Name == 'TRANSPORTAR PACIENTE') {
      this.isPaciente = true;
      if (this.myForm.controls['recurso']['value'].length == 0) {
        this.invalid = true;
      }
      this.myForm.controls['nombrepac'].addValidators(Validators.required)
      this.myForm.controls['aislado'].addValidators(Validators.required)
    } else {
      this.isPaciente = false;
    }
  }

  change(event) {
    let rec = this.myForm.value.recurso.filter((item) => item == event.detail.value)

    if (rec.length > 0) {
      if (!event.detail.checked) {
        this.myForm.value.recurso = this.myForm.value.recurso.filter((item) => item != event.detail.value)
      }

      return;
    }
    this.myForm.value.recurso.push(event.detail.value);
  }


}

