import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';
import { DashboardFiltrosService, HORAS_OPTS } from '../../dashboard-filtros.service';
import { CompartirService } from '../../compartir.service';
import { DashboardExcelService } from '../../dashboard-excel.service';
import { ClinicaService } from 'src/app/Services/clinica.service';

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
  horaFrom = '00:00';
  horaTo = '23:30';
  horasOpts = HORAS_OPTS;
  unidad = 'todos';
  tipo = 'camilleria';
  motivo = '';                // id de motivo o '' (todos)
  destinos: string[] = [];
  origenes: string[] = [];

  // Se arma segun la clinica en ngOnInit (Medellin: Adultos/Infantil,
  // Rionegro: Alta complejidad/Medicina privada).
  unidadOpts: { v: string; l: string }[] = [{ v: 'todos', l: 'Todas' }];
  tipoOpts = [
    { v: 'camilleria', l: 'Camillería' },
    { v: 'admin', l: 'Administrativas' },
    { v: 'todos', l: 'Todos' }
  ];

  motivos: any[] = [];       // motivos de la zona para el filtro MOTIVO
  ubicaciones: any[] = [];   // lista para los selects Origen / Destino

  // Texto del buscador interno de cada select (mismo patron que Perfiles)
  destinosSearch = '';
  origenesSearch = '';

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
    private excel: DashboardExcelService,
    private clinica: ClinicaService
  ) { }

  async ngOnInit() {
    if (this.modoPublico) {
      if (this.datosPublicos) this.aplicarDatos(this.datosPublicos);
      return;
    }
    this.desde = this.filtros.desde;
    this.hasta = this.filtros.hasta;
    this.horaFrom = this.filtros.horaFrom;
    this.horaTo = this.filtros.horaTo;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.motivo = this.filtros.motivo;

    // El slicer UNIDAD solo lista los grupos que existen en la clínica actual.
    const u = await this.clinica.unidadPara(this.unidad, 'Todas', false);
    this.unidadOpts = u.opts;
    this.unidad = u.unidad;
    this.filtros.unidad = this.unidad;

    this.cargarMotivos();
    this.cargarUbicaciones();
    this.cargar();
  }

  ngOnChanges(ch: SimpleChanges) {
    if (this.modoPublico && ch['datosPublicos'] && !ch['datosPublicos'].firstChange && this.datosPublicos) {
      this.aplicarDatos(this.datosPublicos);
    }
  }

  async cargarMotivos() {
    const login = await this.stg.getLogin();
    if (!login) return;
    const rs: any = await this.api.apiGet('motivos?WorkZoneID=' + login[0].WorkZone, login[0].token);
    if (rs && rs.status) this.motivos = rs.response || [];
  }

  async cargarUbicaciones() {
    const login = await this.stg.getLogin();
    if (!login) return;
    const rs: any = await this.api.apiGet('locations?WorkZoneID=' + login[0].WorkZone, login[0].token);
    if (rs && rs.status) this.ubicaciones = rs.response || [];
  }

  // Buscador interno de los selects Destino / Origen.
  // Las ya seleccionadas se conservan aunque no coincidan con el texto, para no
  // perder la seleccion al filtrar (mismo criterio que Perfiles).
  filterUbicaciones(term: string, selected: string[] = []): any[] {
    const t = (term || '').trim().toLowerCase();
    if (!t) return this.ubicaciones;
    const sel = selected || [];
    return this.ubicaciones.filter(
      (u) => (u.Name || '').toLowerCase().includes(t) || sel.includes(u._id)
    );
  }

  private guardarFiltros() {
    this.filtros.desde = this.desde;
    this.filtros.hasta = this.hasta;
    this.filtros.horaFrom = this.horaFrom;
    this.filtros.horaTo = this.horaTo;
    this.filtros.unidad = this.unidad;
    this.filtros.tipo = this.tipo;
    this.filtros.motivo = this.motivo;
  }

  private fmtFecha(d: Date, fin: boolean): string {
    if (!d) return '';
    const dia = moment(d).format('YYYY-MM-DD');
    const hora = (fin ? (this.horaTo || '23:30') : (this.horaFrom || '00:00')) + (fin ? ':59' : ':00');
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
    if (this.motivo) f.Motivo = this.motivo;
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
    if (this.motivo) body.Motivo = this.motivo;
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
    this.horaFrom = this.filtros.horaFrom;
    this.horaTo = this.filtros.horaTo;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.motivo = this.filtros.motivo;
    this.destinos = [];
    this.origenes = [];
    this.destinosSearch = '';
    this.origenesSearch = '';
    this.cargar();
  }

  setUnidad(v: string) { this.unidad = v; this.cargar(); }
  setTipo(v: string) { this.tipo = v; this.cargar(); }

  // Excel con la data cruda con la que se construyó el indicador
  descargar() {
    this.excel.descargar(this.filtrosActuales(), 'camilleria4_ubicaciones.xlsx');
  }
}
