import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

@Component({
  selector: 'app-asociative',
  templateUrl: './asociative.component.html',
  styleUrls: ['./asociative.component.scss'],
})
export class CustomOptionComponent implements OnInit {

  loadActivities;
  loading;
  list = [];
  list2 = [];

  myForm: FormGroup<any>;

  @Input() type;
  @Input() data;

  eliminado;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController,
    private router: Router,
    private activate: ActivatedRoute,
    private modal: ModalController,
    private fb: FormBuilder,
  ) {



  }



  async ngOnInit() {


  }

  async ionViewWillEnter() {


    const login = await this.stg.getLogin();

    if (login) {

      this.getHistory();
      this.loadForm()

    }

  }


  loadForm() {
    this.eliminado = this.data ? (this.data.IsDeleted  ? true : false): false;
    console.log(this.data)
    this.myForm = this.fb.group({
      name: new FormControl(this.data ? this.data.name : '', [
        // validaciones síncronas
        Validators.required

      ]),
      motivo: new FormControl(this.data ? this.data.motivo : '', [
        // validaciones síncronas
        Validators.required

      ]),
      ref: new FormControl(this.data ? this.data.ref : '', [
        // validaciones síncronas
        Validators.required

      ])


    });



  }


  async getHistory() {

    const login = await this.stg.getLogin();

    if (login) {
      try {


        const rs = await this.api.apiGet('motivos?WorkZoneID=' + login[0].WorkZone, login[0].token)

        if (rs) {
          console.log(rs)

          this.list = rs.response;
          this.list2 = this.list;

          if (this.data) {
            let idx = this.list2.findIndex((it) => it.Name == this.data.motivo.Name)

            if (idx >= 0) {
              this.myForm.controls['motivo'].setValue(this.list2[idx])
            }

          }


          this.loadActivities = true;


        }
      } catch (error) {
        this.loadActivities = true;
      }
    }
  }


  onKey(value) {

    this.list2 = this.search(value.target.value);
  }


  search(value: any) {

    let filter = value.toLowerCase();

    return this.list.filter(option => {

      let name = option.Name.toLowerCase()
      return name.includes(filter)
    });
  }



  async create() {



    const login = await this.stg.getLogin();

    if (login) {
      try {

        if (!this.myForm.valid) {
          this.toast.MsgError('Hay campos sin llenar')
          return;
        }

        this.loading = true;

        const rs = await this.api.apiPost(this.data ? 'customoptionsEdit' : 'customoptions', {
          token: login[0].token,
          Name: this.myForm.controls['name'].value,
          Api: (this.myForm.controls['ref'].value + 'CUSTOMAPI').toString().toUpperCase().trim(),
          Motivo: this.myForm.controls['motivo'].value._id,
          WorkZoneID: login[0].WorkZone,
          _id: this.data ? this.data.acc._id : false
        })

        if (rs) {

          console.log(rs)
          this.loading = false;

          if (!rs['status']) {
            this.toast.MsgError(rs['err'])
            return;
          }

          this.modal.dismiss(true)



          this.toast.MsgOK('Proceso completado')


        }
      } catch (error) {

        this.loading = false;
      }
    }

  }


  changeDelete(event) {
    this.eliminado = event.detail.checked;
  }
}