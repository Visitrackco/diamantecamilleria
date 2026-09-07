import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';
import { DashboardFiltrosService, HORAS_OPTS } from '../../dashboard-filtros.service';
import { CompartirService } from '../../compartir.service';
import { DashboardExcelService } from '../../dashboard-excel.service';
import { colorHeat, colorTextoHeat } from '../../heatmap';
import { ClinicaService } from 'src/app/Services/clinica.service';

// CANTIDAD DE CAMILLEROS: mapa de calor hora x dia con la cantidad de camilleros
// DISTINTOS que tuvieron al menos una asignacion en esa hora (AssignedTo + AssignedOn).
// Ojo: la fila "Total" no es la suma de la columna, son los camilleros distintos del
// dia (un mismo camillero puede aparecer en varias horas y se cuenta una sola vez).
@Component({
  selector: 'app-bi-cantidad',
  templateUrl: './cantidad.component.html',
  styleUrls: ['./cantidad.component.scss'],
})
export class CantidadComponent implements OnInit, OnChanges {

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
  prioridad = 'todos';
  unidad = 'todos';
  tipo = 'camilleria';
  motivo = '';

  prioridadOpts = [
    { v: 'todos', l: 'Seleccionar todo' },
    { v: 'critico', l: 'CRÍTICO' },
    { v: 'nocritico', l: 'NO CRÍTICO' }
  ];
  // Se arma segun la clinica en ngOnInit (Medellin: Adultos/Infantil,
  // Rionegro: Alta complejidad/Medicina privada).
  unidadOpts: { v: string; l: string }[] = [{ v: 'todos', l: 'Seleccionar todo' }];
  tipoOpts = [
    { v: 'camilleria', l: 'CAMILLERÍA' },
    { v: 'admin', l: 'ADMINISTRATIVAS' },
    { v: 'todos', l: 'TODOS' }
  ];

  motivos: any[] = [];

  // Filtro HORA (selección múltiple). Recorta las horas del mapa y se manda al
  // backend para que los totales por día también se calculen solo con esas horas.
  horas = Array.from({ length: 24 }, (_, i) => i);
  horasSel: number[] = Array.from({ length: 24 }, (_, i) => i);
  horasAbierto = false;
  private tHoras: any = null;

  // Datos
  dias: string[] = [];
  diasLabel: string[] = [];
  matriz: any = {};
  totales: any = {};
  maxCelda = 1;
  totalCamilleros = 0;
  cantidadAsignaciones = 0;

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
    this.prioridad = this.filtros.prioridad;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.motivo = this.filtros.motivo;

    // El slicer UNIDAD solo lista los grupos que existen en la clínica actual.
    const u = await this.clinica.unidadPara(this.unidad);
    this.unidadOpts = u.opts;
    this.unidad = u.unidad;
    this.filtros.unidad = this.unidad;

    this.cargarMotivos();
    this.cargar();
  }

  ngOnChanges(ch: SimpleChanges) {
    if (this.modoPublico && ch['datosPublicos'] && !ch['datosPublicos'].firstChange && this.datosPublicos) {
      this.aplicarDatos(this.datosPublicos);
    }
  }

  aplicarDatos(r: any) {
    this.dias = r.dias || [];
    this.diasLabel = r.diasLabel || [];
    this.matriz = r.matriz || {};
    this.totales = r.totales || {};
    this.maxCelda = r.maxCelda || 1;
    this.totalCamilleros = r.totalCamilleros || 0;
    this.cantidadAsignaciones = r.cantidadAsignaciones || 0;
    // En el link público las horas vienen fijadas por quien compartió el tablero
    if (r.horas && r.horas.length) this.horasSel = r.horas;
  }

  // Horas que se pintan como filas del mapa
  get horasVisibles(): number[] {
    return this.horas.filter((h) => this.horasSel.indexOf(h) >= 0);
  }

  get todasLasHoras(): boolean {
    return this.horasSel.length === this.horas.length;
  }

  get horasLabel(): string {
    if (this.todasLasHoras) return 'Todas las horas';
    if (!this.horasSel.length) return 'Ninguna hora';
    return this.horasSel.length + ' hora' + (this.horasSel.length > 1 ? 's' : '') + ' seleccionada' + (this.horasSel.length > 1 ? 's' : '');
  }

  horaOn(h: number): boolean {
    return this.horasSel.indexOf(h) >= 0;
  }

  toggleHoras() {
    this.horasAbierto = !this.horasAbierto;
  }

  toggleHora(h: number) {
    const i = this.horasSel.indexOf(h);
    if (i >= 0) this.horasSel.splice(i, 1);
    else this.horasSel.push(h);
    this.horasSel.sort((a, b) => a - b);
    this.recargarHoras();
  }

  todasHoras() {
    this.horasSel = [...this.horas];
    this.recargarHoras();
  }

  ningunaHora() {
    this.horasSel = [];
    this.recargarHoras();
  }

  // Agrupa clics seguidos sobre las horas en una sola consulta
  private recargarHoras() {
    if (this.tHoras) clearTimeout(this.tHoras);
    this.tHoras = setTimeout(() => this.cargar(), 500);
  }

  // KPIs derivados de la matriz. El promedio va redondeado a entero porque son
  // camilleros: "4,3 camilleros" no dice nada.
  get promedioDia(): number {
    if (!this.dias.length) return 0;
    const suma = this.dias.reduce((acc, d) => acc + (this.totales[d] || 0), 0);
    return Math.round(suma / this.dias.length);
  }

  celda(hora: number, dia: string): number {
    const fila = this.matriz[hora];
    return fila && fila[dia] != null ? fila[dia] : 0;
  }

  // Intensidad de la celda: 0 (ninguno) a 1 (el maximo del rango consultado)
  private intensidad(count: number): number {
    return this.maxCelda > 0 ? count / this.maxCelda : 0;
  }

  // Color de fondo segun la cantidad (amarillo -> naranja -> rojo)
  colorCount(count: number): string {
    return colorHeat(this.intensidad(count));
  }

  // Estilo de la celda: intensidad segun cantidad / maximo
  estiloCelda(count: number): any {
    if (!count) return {};
    const t = this.intensidad(count);
    return {
      background: colorHeat(t),
      color: colorTextoHeat(t)
    };
  }

  // Leyenda de intensidades (a partir de que numero cambia cada color)
  get leyenda(): any[] {
    const max = this.maxCelda || 1;
    const t1 = Math.max(1, Math.round(max * 0.25));
    const t2 = Math.max(t1 + 1, Math.round(max * 0.5));
    const t3 = Math.max(t2 + 1, Math.round(max * 0.75));
    return [
      { color: this.colorCount(0), nivel: 'Bajo', rango: '1 – ' + t1 },
      { color: this.colorCount((t1 + t2) / 2), nivel: 'Medio', rango: (t1 + 1) + ' – ' + t2 },
      { color: this.colorCount((t2 + t3) / 2), nivel: 'Alto', rango: (t2 + 1) + ' – ' + t3 },
      { color: this.colorCount(max), nivel: 'Muy alto', rango: (t3 + 1) + ' – ' + max }
    ];
  }

  async cargarMotivos() {
    const login = await this.stg.getLogin();
    if (!login) return;
    const rs: any = await this.api.apiGet('motivos?WorkZoneID=' + login[0].WorkZone, login[0].token);
    if (rs && rs.status) this.motivos = rs.response || [];
  }

  private fmtFecha(d: Date, fin: boolean): string {
    if (!d) return '';
    const dia = moment(d).format('YYYY-MM-DD');
    const hora = (fin ? (this.horaTo || '23:30') : (this.horaFrom || '00:00')) + (fin ? ':59' : ':00');
    return moment.tz(dia + ' ' + hora, 'America/Bogota').utc().format('YYYY-MM-DD HH:mm:ss');
  }

  private guardarFiltros() {
    this.filtros.desde = this.desde;
    this.filtros.hasta = this.hasta;
    this.filtros.horaFrom = this.horaFrom;
    this.filtros.horaTo = this.horaTo;
    this.filtros.prioridad = this.prioridad;
    this.filtros.unidad = this.unidad;
    this.filtros.tipo = this.tipo;
    this.filtros.motivo = this.motivo;
  }

  filtrosActuales(): any {
    const f: any = {
      Desde: this.fmtFecha(this.desde, false),
      Hasta: this.fmtFecha(this.hasta, true),
      Tipo: this.tipo,
      // El rango se mide sobre la fecha de ASIGNACIÓN, no sobre la de la solicitud.
      // Va también en el Excel y en el link compartido para que den lo mismo.
      Rango: 'asignacion'
    };
    if (this.prioridad !== 'todos') f.Prioridad = this.prioridad;
    if (this.unidad !== 'todos') f.Unidad = this.unidad;
    if (this.motivo) f.Motivo = this.motivo;
    if (!this.todasLasHoras) f.Horas = [...this.horasSel];
    return f;
  }

  compartir() {
    this.compartirSvc.compartir('cantidad', this.filtrosActuales());
  }

  descargar() {
    this.excel.descargar(this.filtrosActuales(), 'cantidad_camilleros.xlsx');
  }

  async cargar() {
    this.guardarFiltros();
    const login = await this.stg.getLogin();
    if (!login) return;

    // Sin horas seleccionadas no hay nada que consultar
    if (!this.horasSel.length) {
      this.dias = [];
      this.diasLabel = [];
      this.matriz = {};
      this.totales = {};
      this.maxCelda = 1;
      this.totalCamilleros = 0;
      this.cantidadAsignaciones = 0;
      return;
    }

    this.loading = true;

    const body: any = {
      token: login[0].token,
      WorkZoneID: login[0].WorkZone,
      Format: 'America/Bogota',
      ...this.filtrosActuales()
    };

    try {
      const rs: any = await this.api.apiPost('dashboard/cantidadcamilleros', body);
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
    this.prioridad = this.filtros.prioridad;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.motivo = this.filtros.motivo;
    this.horasSel = [...this.horas];
    this.cargar();
  }

  setPrioridad(v: string) { this.prioridad = v; this.cargar(); }
  setUnidad(v: string) { this.unidad = v; this.cargar(); }
  setTipo(v: string) { this.tipo = v; this.cargar(); }
}
