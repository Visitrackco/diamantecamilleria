import { Component, HostListener, Input } from '@angular/core';

// Contenedor de los filtros de una pantalla del dashboard.
//
// En escritorio no existe: es `display: contents`, asi que las tarjetas de filtro
// que se le proyectan caen tal cual dentro de la barra superior de la pagina y se
// ven igual que antes. En pantallas angostas se convierte en un menu vertical que
// entra desde la DERECHA (el menu de paginas entra desde la izquierda), y en la
// barra queda solo el boton "Filtros": asi las tarjetas amarillas no se comen la
// pantalla en un celular.
@Component({
  selector: 'app-bi-filtros',
  templateUrl: './filtros.component.html',
  styleUrls: ['./filtros.component.scss'],
})
export class FiltrosComponent {

  // Texto del boton, por si una pantalla quiere nombrarlo distinto.
  @Input() titulo = 'Filtros';

  abierto = false;

  abrir() {
    this.abierto = true;
  }

  cerrar() {
    this.abierto = false;
  }

  // Si se ensancha la ventana (girar el celular o volver al escritorio) el panel
  // deja de tener sentido: se cierra para no dejar el fondo oscuro pegado.
  @HostListener('window:resize')
  onResize() {
    if (this.abierto && window.innerWidth > 900) this.cerrar();
  }

}
