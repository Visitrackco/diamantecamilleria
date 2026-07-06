import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';
import { DashboardFiltrosService } from '../../dashboard-filtros.service';
import { CompartirService } from '../../compartir.service';
import { DashboardExcelService } from '../../dashboard-excel.service';

// CAMILLERIA 4: cumplimiento por ubicación (Destino y Origen).
@Component({
  selector: 'app-bi-camilleria4',
  templateUrl: './camilleria4.component.html',
  styleUrls: ['./camilleria4.component.scss'],
})
export class Camilleria4Component implements OnInit, OnChanges {

  loading = false;

  // Modo público (link de solo lectura)
  @Input() modoPublico = false;
  @Input() datosPublicos: any = null;

  // Filtros
  desde: Date = null;
  hasta: Date = null;
  unidad = 'todos';
  tipo = 'camilleria';
  destinos: string[] = [];
  origenes: string[] = [];

  unidadOpts = [
    { v: 'todos', l: 'Todas' },
    { v: 'Adultos', l: 'Adultos' },
    { v: 'Infantil', l: 'Infantil' }
  ];
  tipoOpts = [
    { v: 'camilleria', l: 'Camillería' },
    { v: 'admin', l: 'Administrativas' },
    { v: 'todos', l: 'Todos' }
  ];

  ubicaciones: any[] = [];   // lista para los selects Destino / Origen

  // Datos
  meta = 90;
  destino: any[] = [];
  totalDestino: any = { aTiempo: 0, fuera: 0, total: 0, aTiempoPct: null, fueraPct: null };
  origen: any[] = [];
  totalOrigen: any = { aTiempo: 0, fuera: 0, total: 0, aTiempoPct: null, fueraPct: null };

  // Paginación (10 por página)
  pageSize = 10;
  pageDestino = 1;
  pageOrigen = 1;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private filtros: DashboardFiltrosService,
    private compartirSvc: CompartirService,
    private excel: DashboardExcelService
  ) { }

  ngOnInit() {
    if (this.modoPublico) {
      if (this.datosPublicos) this.aplicarDatos(this.datosPublicos);
      return;
    }
    this.desde = this.filtros.desde;
    this.hasta = this.filtros.hasta;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.cargarUbicaciones();
    this.cargar();
  }

  ngOnChanges(ch: SimpleChanges) {
    if (this.modoPublico && ch['datosPublicos'] && !ch['datosPublicos'].firstChange && this.datosPublicos) {
      this.aplicarDatos(this.datosPublicos);
    }
  }

  async cargarUbicaciones() {
    const login = await this.stg.getLogin();
    if (!login) return;
    const rs: any = await this.api.apiGet('locations?WorkZoneID=' + login[0].WorkZone, login[0].token);
    if (rs && rs.status) this.ubicaciones = rs.response || [];
  }

  private guardarFiltros() {
    this.filtros.desde = this.desde;
    this.filtros.hasta = this.hasta;
    this.filtros.unidad = this.unidad;
    this.filtros.tipo = this.tipo;
  }

  private fmtFecha(d: Date, fin: boolean): string {
    if (!d) return '';
    const dia = moment(d).format('YYYY-MM-DD');
    const hora = fin ? '23:59:59' : '00:00:00';
    return moment.tz(dia + ' ' + hora, 'America/Bogota').utc().format('YYYY-MM-DD HH:mm:ss');
  }

  aplicarDatos(r: any) {
    this.meta = r.meta != null ? r.meta : 90;
    this.destino = r.destino || [];
    this.totalDestino = r.totalDestino || { aTiempo: 0, fuera: 0, total: 0, aTiempoPct: null, fueraPct: null };
    this.origen = r.origen || [];
    this.totalOrigen = r.totalOrigen || { aTiempo: 0, fuera: 0, total: 0, aTiempoPct: null, fueraPct: null };
    this.pageDestino = 1;
    this.pageOrigen = 1;
  }

  // --- Paginación ---
  get destinoPage(): any[] {
    const ini = (this.pageDestino - 1) * this.pageSize;
    return this.destino.slice(ini, ini + this.pageSize);
  }
  get origenPage(): any[] {
    const ini = (this.pageOrigen - 1) * this.pageSize;
    return this.origen.slice(ini, ini + this.pageSize);
  }
  get totalPagesDestino(): number { return Math.max(1, Math.ceil(this.destino.length / this.pageSize)); }
  get totalPagesOrigen(): number { return Math.max(1, Math.ceil(this.origen.length / this.pageSize)); }

  prevDestino() { if (this.pageDestino > 1) this.pageDestino--; }
  nextDestino() { if (this.pageDestino < this.totalPagesDestino) this.pageDestino++; }
  prevOrigen() { if (this.pageOrigen > 1) this.pageOrigen--; }
  nextOrigen() { if (this.pageOrigen < this.totalPagesOrigen) this.pageOrigen++; }

  filtrosActuales(): any {
    const f: any = {
      Desde: this.fmtFecha(this.desde, false),
      Hasta: this.fmtFecha(this.hasta, true),
      Tipo: this.tipo
    };
    if (this.unidad !== 'todos') f.Unidad = this.unidad;
    if (this.destinos.length) f.Destinos = this.destinos;
    if (this.origenes.length) f.Origenes = this.origenes;
    return f;
  }

  compartir() {
    this.compartirSvc.compartir('camilleria4', this.filtrosActuales());
  }

  async cargar() {
    this.guardarFiltros();
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;

    const body: any = {
      token: login[0].token,
      WorkZoneID: login[0].WorkZone,
      Format: 'America/Bogota',
      Desde: this.fmtFecha(this.desde, false),
      Hasta: this.fmtFecha(this.hasta, true),
      Tipo: this.tipo
    };
    if (this.unidad !== 'todos') body.Unidad = this.unidad;
    if (this.destinos.length) body.Destinos = this.destinos;
    if (this.origenes.length) body.Origenes = this.origenes;

    try {
      const rs: any = await this.api.apiPost('dashboard/ubicaciones', body);
      this.loading = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo cargar el reporte');
        return;
      }
      this.aplicarDatos(rs.response);
    } catch (e) {
      this.loading = false;
      this.toast.MsgError('Error al cargar el reporte');
    }
  }

  aplicar() { this.cargar(); }
  recargar() { this.cargar(); }

  limpiar() {
    this.filtros.reset();
    this.desde = this.filtros.desde;
    this.hasta = this.filtros.hasta;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.destinos = [];
    this.origenes = [];
    this.cargar();
  }

  setUnidad(v: string) { this.unidad = v; this.cargar(); }
  setTipo(v: string) { this.tipo = v; this.cargar(); }

  // Excel con la data cruda con la que se construyó el indicador
  descargar() {
    this.excel.descargar(this.filtrosActuales(), 'camilleria4_ubicaciones.xlsx');
  }
}
