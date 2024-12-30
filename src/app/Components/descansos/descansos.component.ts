import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';

@Component({
  selector: 'app-descansos',
  templateUrl: './descansos.component.html',
  styleUrls: ['./descansos.component.scss'],
})
export class DescansosComponent implements OnInit {

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private stg: StorageWebService,
    private modalCtrl: ModalController
  ) { }

  myForm: FormGroup;

  @Input() config;
  @Input() byuser;

  ngOnInit() {

    this.myForm = this.fb.group({
      desayunomin: new FormControl('', [Validators.required]),
      desayunotime: new FormControl('', [Validators.required]),
      almuerzomin: new FormControl('', [Validators.required]),
      almuerzotime: new FormControl('', [Validators.required]),
      cenamin: new FormControl('', [Validators.required]),
      cenatime: new FormControl('', [Validators.required]),
      libremin: new FormControl('', [Validators.required]),
      libretime: new FormControl('', [Validators.required])

    })

    console.log(this.config)

    if (this.config) {

      if (this.byuser) {
        this.myForm.controls['desayunomin'].setValue(this.config.data.Desayuno.minutes)
       // this.myForm.controls['desayunotime'].setValue(this.config.data.Desayuno.time)
        this.myForm.controls['almuerzomin'].setValue(this.config.data.Almuerzo.minutes)
        //this.myForm.controls['almuerzotime'].setValue(this.config.data.Almuerzo.time)
        this.myForm.controls['cenamin'].setValue(this.config.data.Cena.minutes)
      //  this.myForm.controls['cenatime'].setValue(this.config.data.Cena.time)
        this.myForm.controls['libremin'].setValue(this.config.data.Libre.minutes)
       // this.myForm.controls['libretime'].setValue(this.config.data.Libre.time)
      } else {
        this.myForm.controls['desayunomin'].setValue(this.config.desayuno.minutes)
       // this.myForm.controls['desayunotime'].setValue(this.config.desayuno.time)
        this.myForm.controls['almuerzomin'].setValue(this.config.almuerzo.minutes)
       // this.myForm.controls['almuerzotime'].setValue(this.config.almuerzo.time)
        this.myForm.controls['cenamin'].setValue(this.config.cena.minutes)
       // this.myForm.controls['cenatime'].setValue(this.config.cena.time)
        this.myForm.controls['libremin'].setValue(this.config.libre.minutes)
       // this.myForm.controls['libretime'].setValue(this.config.libre.time)
      }



    }

  }


  async onSubmit() {
    console.log(this.myForm.controls)

    try {
      const login = await this.stg.getLogin();

      if (login) {
        const rs = await this.api.apiPost('descansos', {
          zone: login[0].WorkZone,
          byuser: this.byuser ? 'on' : 'off',
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
          mode: 'group', // 1 is group and 2 is for one person
          userID: this.byuser ? this.config.data.User : null
        })

        if (rs.status) {
          this.modalCtrl.dismiss({reload: true})
        }

        console.log(rs);
      }
    } catch (error) {
      console.error(error.message)
    }
  }







}
