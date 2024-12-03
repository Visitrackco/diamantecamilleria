import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

@Component({
  selector: 'app-version-activities',
  templateUrl: './version-activities.component.html',
  styleUrls: ['./version-activities.component.scss'],
})
export class VersionActivitiesComponent implements OnInit {

  constructor(
    private api: ApiService,
    private modalCtrl: ModalController,
    private storage: StorageWebService,
    private toast: ToastService,
    private sanitizer: DomSanitizer
  ) { }

  @Input() activity;

  loading;

  public versions = [];

  ngOnInit() {

    this.getVerison()

  }

  async getVerison() {
    try {
      this.loading = true;
      const login = await this.storage.getLogin()
      const rs = await this.api.apiGet(`versions?WorkZoneID=${login[0].WorkZone}&activity=${this.activity}`, login[0].token)

      console.log(rs, 'versiones')

      this.versions = rs.response;

      this.versions.forEach((it) => {
        it.html = '<table style="width: 100%;">';

        it.JSONAnswers.forEach((j) => {
          if (!j.Value) {
            return;
          }
          it.html += `<tr style="border-bottom: 1px solid rgba(0,0,0,0.1);">`
          for (const key in j) {
            if (key == 'apiId') {
              it.html += `<td  style="font-size: 12px; padding: 10px; background: #e1e1e1; font-weight: bold; text-transform: uppercase;">${j[key]}</td>`
            } else {
              it.html += `<td  style="padding: 10px; ">${typeof j[key] == 'object' ? JSON.stringify(j[key]) : j[key]}</td>`
            }
            
          }

          it.html += `</tr>`

        })

        it.html += '</table>'

        it.html = this.sanitizer.bypassSecurityTrustHtml(it.html)

        this.loading = false;
      })
    } catch (error) {
      this.loading = false;
      this.toast.MsgError(error.message)
    }
  }

}
