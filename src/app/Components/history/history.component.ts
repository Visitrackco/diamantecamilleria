import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import { AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
 
 @Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent  implements OnInit {

  displayedColumns =
  ['estado', 'fecha', 'solicitud', 'agente'];
dataSource = new MatTableDataSource([]);

@ViewChild('paginatorHistory') paginator: MatPaginator;

@Input() id;
@Input() hidden;
@Input() user;

loadActivities;


loading;


constructor(
  private api: ApiService,
  private stg: StorageWebService,
  private toast: ToastService,
  private socket: SocketService,
  private alertCtrl: AlertController,
  private router: Router,
  private activate: ActivatedRoute
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

}
