import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MenuController } from '@ionic/angular';
import * as moment from 'moment-timezone';
import { ApiService } from 'src/app/Services/api.service';

@Component({
  selector: 'app-form-medellin',
  templateUrl: './form-medellin.page.html',
  styleUrls: ['./form-medellin.page.scss'],
})
export class FormMedellinPage implements OnInit {

  isClick;

  loadInfo = false;


  myForm: FormGroup<any>;

  isPaciente;

  constructor(
    private fb: FormBuilder,
    private menuCtrl: MenuController,
    private api: ApiService
  ) { }

  locations: any[] = [
 
  ];

selectedStates = this.locations; 

invalid;

ionViewWillEnter() {
  this.menuCtrl.enable(true, 'menu')
  this.getLocation()
}

getLocation() {
  this.api.getLocationByZone({
    WorkZoneID: 6842
  }).then((rs) => {
    console.log(rs, 'RESULTADOS')
    this.locations = rs.response;
    this.selectedStates = this.locations;
    this.loadInfo = true;
  })


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
    if (event.detail.value == 'TRANSPORTAR PACIENTE') {
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

