import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';
import { DashboardFiltrosService } from '../../dashboard-filtros.service';
import { CompartirService } from '../../compartir.service';
import { DashboardExcelService } from '../../dashboard-excel.service';

@Component({
  selector: 'app-bi-mapacalor',
  templateUrl: './mapacalor.component.html',
  styleUrls: ['./mapacalor.component.scss'],
})
export class MapacalorComponent implements OnInit, OnChanges {

  loading = false;

  // Modo público (link de solo lectura)
  @Input() modoPublico = false;
  @Input() datosPublicos: any = null;

  // Filtros
  desde: Date = null;
  hasta: Date = null;
  prioridad = 'todos';
  unidad = 'todos';
  tipo = 'camilleria';
  motivo = '';

  prioridadOpts = [
    { v: 'todos', l: 'Seleccionar todo' },
    { v: 'critico', l: 'CRÍTICO' },
    { v: 'nocritico', l: 'NO CRÍTICO' }
  ];
  unidadOpts = [
    { v: 'todos', l: 'Seleccionar todo' },
    { v: 'Adultos', l: 'ADULTOS' },
    { v: 'Infantil', l: 'INFANTIL' }
  ];
  tipoOpts = [
    { v: 'camilleria', l: 'CAMILLERÍA' },
    { v: 'admin', l: 'ADMINISTRATIVAS' },
    { v: 'todos', l: 'TODOS' }
  ];

  motivos: any[] = [];

  // Datos
  meta = 90;
  cantidadServicios = 0;
  cumplimiento: number | null = null;
  dias: string[] = [];
  diasLabel: string[] = [];
  matriz: any = {};
  totales: any = {};
  maxCelda = 1;

  horas = Array.from({ length: 24 }, (_, i) => i);

  gauge: any = null;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private filtros: DashboardFiltrosService,
    private compartirSvc: CompartirService,
    private excel: DashboardExcelService
  ) { }

  descargar() {
    this.excel.descargar(this.filtrosActuales(), 'mapacalor.xlsx');
  }

  ngOnInit() {
    if (this.modoPublico) {
      if (this.datosPublicos) this.aplicarDatos(this.datosPublicos);
      return;
    }
    this.desde = this.filtros.desde;
    this.hasta = this.filtros.hasta;
    this.prioridad = this.filtros.prioridad;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.motivo = this.filtros.motivo;
    this.cargarMotivos();
    this.cargar();
  }

  ngOnChanges(ch: SimpleChanges) {
    if (this.modoPublico && ch['datosPublicos'] && !ch['datosPublicos'].firstChange && this.datosPublicos) {
      this.aplicarDatos(this.datosPublicos);
    }
  }

  aplicarDatos(r: any) {
    this.meta = r.meta != null ? r.meta : 90;
    this.cantidadServicios = r.cantidadServicios || 0;
    this.cumplimiento = r.cumplimiento;
    this.dias = r.dias || [];
    this.diasLabel = r.diasLabel || [];
    this.matriz = r.matriz || {};
    this.totales = r.totales || {};
    this.maxCelda = r.maxCelda || 1;
    this.gauge = this.buildGauge(r.cumplimiento);
  }

  filtrosActuales(): any {
    const f: any = {
      Desde: this.fmtFecha(this.desde, false),
      Hasta: this.fmtFecha(this.hasta, true),
      Tipo: this.tipo
    };
    if (this.prioridad !== 'todos') f.Prioridad = this.prioridad;
    if (this.unidad !== 'todos') f.Unidad = this.unidad;
    if (this.motivo) f.Motivo = this.motivo;
    return f;
  }

  compartir() {
    this.compartirSvc.compartir('mapacalor', this.filtrosActuales());
  }

  private guardarFiltros() {
    this.filtros.desde = this.desde;
    this.filtros.hasta = this.hasta;
    this.filtros.prioridad = this.prioridad;
    this.filtros.unidad = this.unidad;
    this.filtros.tipo = this.tipo;
    this.filtros.motivo = this.motivo;
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
    const hora = fin ? '23:59:59' : '00:00:00';
    return moment.tz(dia + ' ' + hora, 'America/Bogota').utc().format('YYYY-MM-DD HH:mm:ss');
  }

  celda(hora: number, dia: string): number {
    const fila = this.matriz[hora];
    return fila && fila[dia] != null ? fila[dia] : 0;
  }

  // Color de fondo segun la cantidad (blanco -> rojo por intensidad)
  colorCount(count: number): string {
    const alpha = this.maxCelda > 0 ? count / this.maxCelda : 0;
    return 'rgba(203, 32, 39, ' + (0.08 + alpha * 0.85).toFixed(3) + ')';
  }

  // Estilo de la celda: intensidad de rojo segun cantidad / maximo
  estiloCelda(count: number): any {
    if (!count) return {};
    const alpha = this.maxCelda > 0 ? count / this.maxCelda : 0;
    return {
      background: this.colorCount(count),
      color: alpha > 0.55 ? '#fff' : '#5b1013'
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
    if (this.prioridad !== 'todos') body.Prioridad = this.prioridad;
    if (this.unidad !== 'todos') body.Unidad = this.unidad;
    if (this.motivo) body.Motivo = this.motivo;

    try {
      const rs: any = await this.api.apiPost('dashboard/mapacalor', body);
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
    this.prioridad = this.filtros.prioridad;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.motivo = this.filtros.motivo;
    this.cargar();
  }

  setPrioridad(v: string) { this.prioridad = v; this.cargar(); }
  setUnidad(v: string) { this.unidad = v; this.cargar(); }
  setTipo(v: string) { this.tipo = v; this.cargar(); }

  buildGauge(valor: number | null) {
    const v = valor == null ? 0 : valor;
    return {
      series: [v],
      chart: { type: 'radialBar', height: 200, width: '100%' },
      plotOptions: {
        radialBar: {
          startAngle: -90, endAngle: 90,
          hollow: { size: '60%' },
          track: { background: '#e5e7eb', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: -2, fontSize: '24px', fontWeight: 800, color: '#111827',
              formatter: (val: number) => Math.round(val * 10) / 10 + '%'
            }
          }
        }
      },
      fill: { colors: [v < this.meta ? '#c2410c' : '#22c55e'] },
      stroke: { lineCap: 'round' },
      labels: ['Cumplimiento']
    };
  }

}
