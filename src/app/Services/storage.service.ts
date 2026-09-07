import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';


@Injectable({
     providedIn: 'root'
})



export class StorageWebService {

     constructor(
          private storage: Storage
     ) {

     }

     async insertUser(data: any) {
          return this.storage.get('login').then(async (dataLogin: any[]) => {
               dataLogin.push(data);
               await this.storage.set('login', dataLogin);
               console.log('Insertado!');
          }).catch((err) => {
               console.log('Error ', err);
          });
     }

     async putZone(data: any) {

          return new Promise((resolve, rej) => {
               this.storage.get('login').then(async (dataLogin: any[]) => {
                    if (dataLogin.length > 0) {
                         dataLogin[0].WorkZone = data;
                         await this.storage.set('login', dataLogin);

                         resolve(true)
                         console.log('Insertado!');
                    } else {
                         resolve(true)
                    }
                  
               }).catch((err) => {
                    console.log('Error ', err);
                    resolve(false)
               });
          })
       
     }

     // Refresca en el login guardado los permisos del dashboard. Se llama al abrir
     // la app: si la central se los cambió, aplica sin tener que cerrar sesión.
     async putPermisosDashboard(dashboard: number, pages: any[]) {
          return this.storage.get('login').then(async (dataLogin: any[]) => {
               if (dataLogin && dataLogin.length > 0) {
                    dataLogin[0].Dashboard = dashboard;
                    dataLogin[0].DashboardPages = pages || [];
                    await this.storage.set('login', dataLogin);
               }
          }).catch((err) => {
               console.log('Error ', err);
          });
     }

     async getLogin() {
          return await this.storage.get('login');
     }

     async getToken() {
          return await this.storage.get('tokenweb');
     }

     async closeSession() {
          return await this.storage.set('login', []);
     }

}

