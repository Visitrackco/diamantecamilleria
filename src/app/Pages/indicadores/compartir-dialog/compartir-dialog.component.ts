import { Component, OnInit } from '@angular/core';
import { CompartirService, CompartirEstado } from '../compartir.service';

// Diálogo (overlay propio, sin Ionic AlertController) para generar links públicos.
// Se monta una sola vez en el shell del dashboard y reacciona al estado del servicio.
@Component({
  selector: 'app-compartir-dialog',
  templateUrl: './compartir-dialog.component.html',
  styleUrls: ['./compartir-dialog.component.scss'],
})
export class CompartirDialogComponent implements OnInit {

  st: CompartirEstado | null = null;

  constructor(public svc: CompartirService) { }

  ngOnInit() {
    this.svc.estado$.subscribe(s => this.st = s);
  }

  cerrar() { this.svc.cerrar(); }
  generar() { this.svc.generar(); }
  copiar() { this.svc.copiar(); }

  togglePublico(v: boolean) { this.svc.setPublico(v); }
  onNombre(v: string) { this.svc.setNombre(v); }
  onPassword(v: string) { this.svc.setPassword(v); }
  toggleInteractivo(key: string, v: boolean) { this.svc.setInteractivo(key, v); }
}
