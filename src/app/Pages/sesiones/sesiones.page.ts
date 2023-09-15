import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment-timezone';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

@Component({
  selector: 'app-sesiones',
  templateUrl: './sesiones.page.html',
  styleUrls: ['./sesiones.page.scss'],
})
export class SesionesPage implements OnInit {



  displayedColumns =
    ['user', 'info', 'date'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  loadActivities;



  constructor(
    private stg: StorageWebService,
    private toast: ToastService,
    private api: ApiService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter(){
    this.getSessions()
  }

  async getSessions() {
    const login = await this.stg.getLogin();

    if (login) {
      try {

        moment.locale('es')

        const rs = await this.api.getSessions({token: login[0].token})

        console.log(rs, 'co');

        if (rs) {
          rs.response.forEach(element => {
            console.log(element)
            let nuevo = [...this.dataSource.data]
            nuevo.push({
              user: element.user.FirstName + ' ' + element.user.LastName,
              info: element.Agent,
              date: moment(element.DateSession).tz('America/Bogota').format('LLLL')
            })
            this.dataSource.data = nuevo;
          });
        }

        this.loadActivities = true;

      } catch (error) {
        this.loadActivities = true;
      }
    }
  }

}
