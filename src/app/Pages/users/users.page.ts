import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnInit {

  displayedColumns =
    ['estado', 'name'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  loadActivities;


  loading;


  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController,
    private router: Router
  ) {

    this.socket.connectuser().subscribe((data: any) => {
    
      if (data.data) {
        let fila = [...this.dataSource.data]

        const idx = fila.findIndex((it) => it.name._id == data.data.UserID)

        if (idx >= 0) {

          fila[idx].estado = 1;
          fila[idx].islock = 0;
          fila[idx].name.isConnect = 1;


          fila = this.orderUser(fila)

          this.dataSource.data = fila;

          let audio = new Audio('/assets/connect.mp3');
          audio.play();
        }
      }
    })

    this.socket.disconnectuser().subscribe((data: any) => {

      if (data.data) {
        let fila = [...this.dataSource.data]

        const idx = fila.findIndex((it) => it.name._id == data.data.UserID)

        if (idx >= 0) {
          if (data.data.desc == 1) {
            fila[idx].estado = 0.5;
            fila[idx].name.isConnect = 0;
          } else if (data.data.desc == 0) {
            fila[idx].estado = 1;
            let audio = new Audio('/assets/connect.mp3');
            audio.play();
          } else {
            fila[idx].name.isConnect = 0;
            fila[idx].estado = 0;
          }

    

          fila = this.orderUser(fila)

          this.dataSource.data = fila;
        }
      }
    })

  }


  orderUser(arr) {
    return arr.sort((a, b) => {
      if (a.name.isConnect > b.name.isConnect) {
        return -1;
      }
      if (a.name.isConnect < b.name.isConnect) {
        return 1;
      }
      return 0;
    })
  }

  ngOnInit() {
  }


  cancel(){
    this.dataSource.filter = '';
  }

  async ionViewWillEnter() {
    const login = await this.stg.getLogin();

    if (login) {

      this.getUsers();

    }
  }

  async getUsers() {
    const login = await this.stg.getLogin();

    if (login) {
      try {

        this.dataSource.data = [];
        const rs = await this.api.apiGet('usersworkzone?WorkZoneID=' + login[0].WorkZone + '&all=0', login[0].token)

        if (rs) {
          let fila = [...this.dataSource.data];
          rs.response.forEach(element => {
            let obj = {
              estado: element.isConnect,
              name: element
          
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
    this.router.navigate(['/historial', row.name._id, row.name.FirstName + ' ' + row.name.LastName])
  }

  ionViewWillLeave() {
    this.dataSource.data = [];
  }
  

}
