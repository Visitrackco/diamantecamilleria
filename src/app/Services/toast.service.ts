import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
     providedIn: 'root'
})

export class ToastService {

     constructor(
          private toastCtrl: ToastController
     ) { }

     async MsgOK(message: string, duration?) {
          const toast = await this.toastCtrl.create({
               message,
               cssClass: 'ok',
               header: 'Camilleria Diamante dice:',
               
               duration: duration ? duration : 5000
          });

          return await toast.present();
     }


     async MsgError(message: string, duration?) {
        const toast = await this.toastCtrl.create({
             message,
             cssClass: 'not',
             header: 'Camilleria Diamante dice:',
             duration: duration ? duration : 5000
        });

        return await toast.present();
   }

   async notification(title, message: string, duration?) {
     const toast = await this.toastCtrl.create({
          message,
          cssClass: 'alert',
          header: title,
          duration: duration ? duration : 15000,
          position: 'top'
     });

     return await toast.present();
}

}
