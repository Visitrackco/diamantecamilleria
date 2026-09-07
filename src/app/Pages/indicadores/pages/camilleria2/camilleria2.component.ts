import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';
import { DashboardFiltrosService, HORAS_OPTS } from '../../dashboard-filtros.service';
import { CompartirService } from '../../compartir.service';
import { DashboardExcelService } from '../../dashboard-excel.service';
import { ClinicaService } from 'src/app/Services/clinica.service';

@Component({
  selector: 'app-bi-camilleria2',
  templateUrl: './camilleria2.component.html',
  styleUrls: ['./camilleria2.component.scss'],
})
export class Camilleria2Component implements OnInit, OnChanges {

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
  turno = 'todos';            // todos | dia | noche
  motivo = '';                // id de motivo o '' (todos)

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
  turnoOpts = [
    { v: 'todos', l: 'Seleccionar todo' },
    { v: 'dia', l: 'DÍA' },
    { v: 'noche', l: 'NOCHE' }
  ];

  motivos: any[] = [];

  // Datos
  meta = 90;
  dia: any = { total: 0, cumplimiento: null, promedioAsignacionSegs: null };
  noche: any = { total: 0, cumplimiento: null, promedioAsignacionSegs: null };

  gaugeDia: any = null;
  gaugeNoche: any = null;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private filtros: DashboardFiltrosService,
    private compartirSvc: CompartirService,
    private excel: DashboardExcelService,
    private clinica: ClinicaService
  ) { }

  descargar() {
    this.excel.descargar(this.filtrosActuales(), 'camilleria2_turnos.xlsx');
  }

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
    this.turno = this.filtros.turno;
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
    this.meta = r.meta != null ? r.meta : 90;
    this.dia = r.dia || { total: 0, cumplimiento: null, promedioAsignacionSegs: null };
    this.noche = r.noche || { total: 0, cumplimiento: null, promedioAsignacionSegs: null };
    this.gaugeDia = this.buildGauge(this.dia.cumplimiento);
    this.gaugeNoche = this.buildGauge(this.noche.cumplimiento);
  }

  filtrosActuales(): any {
    const f: any = {
      Desde: this.fmtFecha(this.desde, false),
      Hasta: this.fmtFecha(this.hasta, true),
      Tipo: this.tipo,
      Turno: this.turno
    };
    if (this.prioridad !== 'todos') f.Prioridad = this.prioridad;
    if (this.unidad !== 'todos') f.Unidad = this.unidad;
    if (this.motivo) f.Motivo = this.motivo;
    return f;
  }

  compartir() {
    this.compartirSvc.compartir('camilleria2', this.filtrosActuales());
  }

  private guardarFiltros() {
    this.filtros.desde = this.desde;
    this.filtros.hasta = this.hasta;
    this.filtros.horaFrom = this.horaFrom;
    this.filtros.horaTo = this.horaTo;
    this.filtros.prioridad = this.prioridad;
    this.filtros.unidad = this.unidad;
    this.filtros.tipo = this.tipo;
    this.filtros.turno = this.turno;
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
    const hora = (fin ? (this.horaTo || '23:30') : (this.horaFrom || '00:00')) + (fin ? ':59' : ':00');
    return moment.tz(dia + ' ' + hora, 'America/Bogota').utc().format('YYYY-MM-DD HH:mm:ss');
  }

  // Segundos -> HH:mm:ss
  fmtSegs(s: number | null): string {
    if (s == null) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const p = (n: number) => (n < 10 ? '0' + n : '' + n);
    return p(h) + ':' + p(m) + ':' + p(sec);
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
      Tipo: this.tipo,
      Turno: this.turno
    };
    if (this.prioridad !== 'todos') body.Prioridad = this.prioridad;
    if (this.unidad !== 'todos') body.Unidad = this.unidad;
    if (this.motivo) body.Motivo = this.motivo;

    try {
      const rs: any = await this.api.apiPost('dashboard/camilleria2', body);
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
    this.turno = this.filtros.turno;
    this.motivo = this.filtros.motivo;
    this.cargar();
  }

  setPrioridad(v: string) { this.prioridad = v; this.cargar(); }
  setUnidad(v: string) { this.unidad = v; this.cargar(); }
  setTipo(v: string) { this.tipo = v; this.cargar(); }
  setTurno(v: string) { this.turno = v; this.cargar(); }

  buildGauge(valor: number | null) {
    const v = valor == null ? 0 : valor;
    return {
      series: [v],
      chart: { type: 'radialBar', height: 200, width: '100%' },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: { size: '60%' },
          track: { background: '#e5e7eb', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: -2,
              fontSize: '24px',
              fontWeight: 800,
              color: '#111827',
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
