import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-ayuda-auditoria',
  templateUrl: './ayuda-auditoria.component.html',
  styleUrls: ['./ayuda-auditoria.component.scss'],
})
export class AyudaAuditoriaComponent {

  constructor(private modalCtrl: ModalController) { }

  cerrar() {
    this.modalCtrl.dismiss();
  }

}
