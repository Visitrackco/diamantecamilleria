import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UbicacionesService } from '../ubicaciones.service';

// Select multiple de ubicaciones con buscador interno, para los filtros ORIGEN y
// DESTINO de todas las pantallas del dashboard (el mismo de COMBINACION DE
// UBICACIONES). La tarjeta amarilla y la etiqueta las pone cada pantalla.
@Component({
  selector: 'app-bi-ubicacion-select',
  templateUrl: './ubicacion-select.component.html',
  styleUrls: ['./ubicacion-select.component.scss'],
})
export class UbicacionSelectComponent implements OnInit {

  // Ids de ubicacion seleccionados ([] = todas).
  @Input() seleccion: string[] = [];
  @Output() seleccionChange = new EventEmitter<string[]>();

  // Placeholder del buscador ("Buscar origen...", "Buscar destino...").
  @Input() buscar = 'Buscar...';

  // Lista ya cargada (vista publica de un link: no hay sesion para pedirla al API).
  // Si no llega, el componente carga las ubicaciones de la zona del usuario.
  @Input() opciones: any[] = null;

  ubicaciones: any[] = [];
  search = '';

  constructor(private ubicacionesSvc: UbicacionesService) { }

  async ngOnInit() {
    if (this.opciones) return;
    this.ubicaciones = await this.ubicacionesSvc.lista();
  }

  private get lista(): any[] {
    return this.opciones || this.ubicaciones;
  }

  // Las ya seleccionadas se conservan aunque no coincidan con el texto, para no
  // perder la seleccion al filtrar (mismo criterio que Perfiles).
  filtradas(): any[] {
    const t = (this.search || '').trim().toLowerCase();
    if (!t) return this.lista;
    const sel = this.seleccion || [];
    return this.lista.filter(
      (u) => (u.Name || '').toLowerCase().includes(t) || sel.includes(u._id)
    );
  }

  cambio(v: string[]) {
    this.seleccion = v || [];
    this.seleccionChange.emit(this.seleccion);
  }
}
