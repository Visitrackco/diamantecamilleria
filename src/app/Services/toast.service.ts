import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
     providedIn: 'root'
})

export class ToastService {

     constructor(
          private toastCtrl: ToastController
     ) { }

     async MsgOK(message: string) {
          const toast = await this.toastCtrl.create({
               message,
               cssClass: 'ok',
               header: 'Camilleria Diamante dice:',
               duration: 5000
          });

          return await toast.present();
     }


     async MsgError(message: string) {
        const toast = await this.toastCtrl.create({
             message,
             cssClass: 'not',
             header: 'Camilleria Diamante dice:',
             duration: 5000
        });

        return await toast.present();
   }

}
