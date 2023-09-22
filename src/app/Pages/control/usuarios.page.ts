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


@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit {

  displayedColumns =
    ['estado', 'name', 'islock', 'isdelete', 'isassigment', 'acc'];
  dataSource = new MatTableDataSource([]);

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  loadActivities;



  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController
  ) { 

    this.socket.connectuser().subscribe((data: any) => {
      console.log(data)
      if (data.data) {
        let fila = [...this.dataSource.data]

        const idx = fila.findIndex((it) => it.acc._id == data.data.UserID)

        if (idx >= 0) {

          fila[idx].estado = 1;

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
          } else if (data.data.desc == 0) {
            fila[idx].estado = 1;
            let audio = new Audio('/assets/connect.mp3');
            audio.play();
          } else {
            fila[idx].estado = 0;
          }

          this.dataSource.data = fila;
        }
      }
    })

  }


  orderUser(arr) {
    return  arr.sort((a, b) => {
      if (a.isConnect > b.isConnect) {
        return -1;
      }
      if (a.isConnect < b.isConnect) {
        return 1;
      }
      return 0;
    })
  }

  ngOnInit() {
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
        const rs = await this.api.apiGet('usersworkzone?WorkZoneID=' + login[0].WorkZone, login[0].token)

        if (rs) {
          let fila = [...this.dataSource.data];
          rs.response.forEach(element => {
            let obj ={
              estado: element.isConnect,
              name: element.FirstName + ' ' + element.LastName,
              islock: element.IsLocked,
              isdelete: element.isCantDelete,
              isassigment: element.isCantAssigment,
              acc: element
            }
            fila.push(obj)
          });
          this.dataSource.data = fila;

   

          this.loadActivities = true;


        }
      } catch (error) {
        this.loadActivities = true;
      }
    }
  }

}
