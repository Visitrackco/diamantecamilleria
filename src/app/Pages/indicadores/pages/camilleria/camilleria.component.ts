import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';
import * as XLSX from 'xlsx';
import { DashboardFiltrosService, HORAS_OPTS } from '../../dashboard-filtros.service';
import { CompartirService } from '../../compartir.service';
import { ClinicaService } from 'src/app/Services/clinica.service';

@Component({
  selector: 'app-bi-camilleria',
  templateUrl: './camilleria.component.html',
  styleUrls: ['./camilleria.component.scss'],
})
export class CamilleriaComponent implements OnInit, OnChanges {

  loading = false;

  // Modo público (link de solo lectura): recibe los datos ya calculados y oculta filtros.
  @Input() modoPublico = false;
  @Input() datosPublicos: any = null;

  // Filtros
  desde: Date = null;
  hasta: Date = null;
  horaFrom = '00:00';
  horaTo = '23:30';
  horasOpts = HORAS_OPTS;
  prioridad = 'todos';        // todos | critico | nocritico
  unidad = 'todos';           // todos | Adultos | Infantil
  tipo = 'camilleria';        // camilleria (isAdmin=0) | admin (isAdmin=1) | todos

  prioridadOpts = [
    { v: 'todos', l: 'Seleccionar todo' },
    { v: 'critico', l: 'CRÍTICO' },
    { v: 'nocritico', l: 'NO CRÍTICO' }
  ];
  tipoOpts = [
    { v: 'camilleria', l: 'CAMILLERÍA' },
    { v: 'admin', l: 'ADMINISTRATIVAS' },
    { v: 'todos', l: 'TODOS' }
  ];
  // Se arma segun la clinica en ngOnInit (Medellin: Adultos/Infantil,
  // Rionegro: Alta complejidad/Medicina privada).
  unidadOpts: { v: string; l: string }[] = [{ v: 'todos', l: 'Seleccionar todo' }];

  // Motivos de la zona: la tabla trae el nombre y el backend filtra por _id.
  motivos: any[] = [];

  // Motivo seleccionado en la tabla; solo afecta la grafica de tendencia.
  motivoSel = '';
  motivoSelNombre = '';
  motivoSelFila: any = null;
  loadingLinea = false;
  private tendenciaGlobal: any[] = [];

  // Datos del reporte
  cantidadServicios = 0;
  cumplimiento: number | null = null;
  distribucion: any[] = [];
  totalAtiempo = 0;
  totalFuera = 0;
  meta = 90;   // meta de cumplimiento configurada (colección del dashboard)

  // Charts (ApexCharts)
  gauge: any = null;
  line: any = null;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private filtros: DashboardFiltrosService,
    private compartirSvc: CompartirService,
    private clinica: ClinicaService
  ) { }

  async ngOnInit() {
    if (this.modoPublico) {
      // Link público: usa los datos ya calculados, sin filtros ni API.
      if (this.datosPublicos) this.aplicarDatos(this.datosPublicos);
      return;
    }
    // Hereda los filtros compartidos del dashboard
    this.desde = this.filtros.desde;
    this.hasta = this.filtros.hasta;
    this.horaFrom = this.filtros.horaFrom;
    this.horaTo = this.filtros.horaTo;
    this.prioridad = this.filtros.prioridad;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;

    // El slicer UNIDAD solo lista los grupos que existen en la clínica actual.
    const u = await this.clinica.unidadPara(this.unidad);
    this.unidadOpts = u.opts;
    this.unidad = u.unidad;
    this.filtros.unidad = this.unidad;

    this.cargarMotivos();
    this.cargar();
  }

  ngOnChanges(ch: SimpleChanges) {
    // En modo público, si el contenedor cambia los datos (por un filtro interactivo), re-pinta
    if (this.modoPublico && ch['datosPublicos'] && !ch['datosPublicos'].firstChange && this.datosPublicos) {
      this.aplicarDatos(this.datosPublicos);
    }
  }

  // Vuelca la respuesta del reporte al estado (usado por cargar y por el modo público)
  aplicarDatos(r: any) {
    this.meta = r.meta != null ? r.meta : 90;
    this.cantidadServicios = r.cantidadServicios || 0;
    this.cumplimiento = r.cumplimiento;
    this.distribucion = r.distribucionPorMotivo || [];
    this.totalAtiempo = r.totales ? r.totales.aTiempo : 0;
    this.totalFuera = r.totales ? r.totales.fueraTiempo : 0;
    this.buildGauge(r.cumplimiento);
    this.tendenciaGlobal = r.tendencia || [];
    this.buildLine(this.tendenciaGlobal);

    // Si el motivo que estaba marcado ya no aparece con los filtros nuevos, se suelta.
    if (this.motivoSelNombre) {
      const fila = this.distribucion.find((m) => m.motivo === this.motivoSelNombre);
      if (!fila) this.quitarMotivo();
      else this.motivoSelFila = fila;
    }
  }

  // Filtros actuales en el formato que consume el backend (para compartir el link)
  filtrosActuales(): any {
    const f: any = {
      Desde: this.fmtFecha(this.desde, false),
      Hasta: this.fmtFecha(this.hasta, true),
      Tipo: this.tipo
    };
    if (this.prioridad !== 'todos') f.Prioridad = this.prioridad;
    if (this.unidad !== 'todos') f.Unidad = this.unidad;
    return f;
  }

  compartir() {
    this.compartirSvc.compartir('camilleria', this.filtrosActuales());
  }

  // Manda los limites del dia (en Bogota) expresados en UTC, igual que el report:
  // dia 30 -> inicio "2023-10-30 05:00:00", fin "2023-10-31 04:59:59". El back los convierte.
  private fmtFecha(d: Date, fin: boolean): string {
    if (!d) return '';
    const dia = moment(d).format('YYYY-MM-DD');
    const hora = (fin ? (this.horaTo || '23:30') : (this.horaFrom || '00:00')) + (fin ? ':59' : ':00');
    return moment.tz(dia + ' ' + hora, 'America/Bogota').utc().format('YYYY-MM-DD HH:mm:ss');
  }

  // Guarda los filtros actuales en el servicio compartido (para que otras pantallas los hereden)
  private guardarFiltros() {
    this.filtros.desde = this.desde;
    this.filtros.hasta = this.hasta;
    this.filtros.horaFrom = this.horaFrom;
    this.filtros.horaTo = this.horaTo;
    this.filtros.prioridad = this.prioridad;
    this.filtros.unidad = this.unidad;
    this.filtros.tipo = this.tipo;
  }

  // Cuerpo que consume el reporte con los filtros de la barra superior.
  private cuerpo(login: any): any {
    const body: any = {
      token: login[0].token,
      WorkZoneID: login[0].WorkZone,    // zona habilitada en el front
      Format: 'America/Bogota',
      Desde: this.fmtFecha(this.desde, false),
      Hasta: this.fmtFecha(this.hasta, true)
    };
    if (this.prioridad !== 'todos') body.Prioridad = this.prioridad;
    if (this.unidad !== 'todos') body.Unidad = this.unidad;
    body.Tipo = this.tipo;
    return body;
  }

  async cargar() {
    this.guardarFiltros();
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;

    try {
      const rs: any = await this.api.apiPost('dashboard/camilleria', this.cuerpo(login));
      this.loading = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo cargar el reporte');
        return;
      }

      this.aplicarDatos(rs.response);

      // aplicarDatos repinta la tendencia global: si hay un motivo marcado, se vuelve a aplicar.
      if (this.motivoSel) this.cargarTendenciaMotivo();
    } catch (e) {
      this.loading = false;
      this.toast.MsgError('Error al cargar el reporte');
    }
  }

  async cargarMotivos() {
    const login = await this.stg.getLogin();
    if (!login) return;
    const rs: any = await this.api.apiGet('motivos?WorkZoneID=' + login[0].WorkZone, login[0].token);
    if (rs && rs.status) this.motivos = rs.response || [];
  }

  // El reporte devuelve el motivo por nombre; el backend lo filtra por _id.
  private idDeMotivo(fila: any): string {
    if (fila.motivoId) return fila.motivoId;
    const m = this.motivos.find((x) => x.Name === fila.motivo);
    return m ? m._id : '';
  }

  // Clic en una fila de la tabla: la tendencia pasa a mostrar solo ese motivo.
  // Un segundo clic sobre la misma fila vuelve a la tendencia de todos los motivos.
  seleccionarMotivo(fila: any) {
    if (this.modoPublico) return;

    if (this.motivoSelNombre === fila.motivo) {
      this.quitarMotivo();
      return;
    }

    const id = this.idDeMotivo(fila);
    if (!id) {
      this.toast.MsgError('No se encontró el motivo "' + fila.motivo + '" en esta zona');
      return;
    }

    this.motivoSel = id;
    this.motivoSelNombre = fila.motivo;
    this.motivoSelFila = fila;
    this.cargarTendenciaMotivo();
  }

  quitarMotivo() {
    this.motivoSel = '';
    this.motivoSelNombre = '';
    this.motivoSelFila = null;
    this.buildLine(this.tendenciaGlobal);
  }

  // Vuelve a pedir el reporte con el motivo marcado, pero solo usa su tendencia:
  // los KPIs y la tabla siguen mostrando el total de los filtros de arriba.
  async cargarTendenciaMotivo() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loadingLinea = true;

    try {
      const body = this.cuerpo(login);
      body.Motivo = this.motivoSel;

      const rs: any = await this.api.apiPost('dashboard/camilleria', body);
      this.loadingLinea = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo cargar la tendencia del motivo');
        this.quitarMotivo();
        return;
      }

      this.buildLine(rs.response.tendencia || []);
    } catch (e) {
      this.loadingLinea = false;
      this.toast.MsgError('Error al cargar la tendencia del motivo');
      this.quitarMotivo();
    }
  }

  aplicar() {
    this.cargar();
  }

  recargar() {
    this.cargar();
  }

  setPrioridad(v: string) {
    this.prioridad = v;
    this.cargar();
  }

  setUnidad(v: string) {
    this.unidad = v;
    this.cargar();
  }

  setTipo(v: string) {
    this.tipo = v;
    this.cargar();
  }

  limpiar() {
    this.filtros.reset();
    this.desde = this.filtros.desde;
    this.hasta = this.filtros.hasta;
    this.horaFrom = this.filtros.horaFrom;
    this.horaTo = this.filtros.horaTo;
    this.prioridad = this.filtros.prioridad;
    this.unidad = this.filtros.unidad;
    this.tipo = this.filtros.tipo;
    this.quitarMotivo();
    this.cargar();
  }

  async descargar() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;

    const body = this.cuerpo(login);

    try {
      const rs: any = await this.api.apiPost('dashboard/camilleria/raw', body);
      this.loading = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo descargar la data');
        return;
      }

      const r = rs.response;
      const rows = r.rows || [];
      if (!rows.length) {
        this.toast.MsgError('No hay datos para el rango/filtros seleccionados');
        return;
      }

      const data = rows.map((x: any) => ({
        _id: x._id,
        dateVisible: x.dateVisible,
        CompanyStatus: x.CompanyStatus,
        isDesnormalized: x.isDesnormalized,
        enDesnormalizada: x.enDesnormalizada
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const nombre = 'camilleria_raw_' + (body.Desde || 'hoy') + '_' + (body.Hasta || 'hoy') + '.xlsx';
      XLSX.writeFile(wb, nombre);

      this.toast.MsgOK(`Descargado: ${r.totalOriginal} registros · faltan ${r.faltantes} en la desnormalizada`);
    } catch (e) {
      this.loading = false;
      this.toast.MsgError('Error al descargar la data');
    }
  }

  buildGauge(valor: number | null) {
    const v = valor == null ? 0 : valor;
    this.gauge = {
      series: [v],
      chart: { type: 'radialBar', height: 280, width: '100%', sparkline: { enabled: false } },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: { size: '62%' },
          track: { background: '#e5e7eb', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: -2,
              fontSize: '38px',
              fontWeight: 800,
              color: '#111827',
              formatter: (val: number) => Math.round(val * 10) / 10 + '%'
            }
          }
        }
      },
      fill: { colors: ['#22c55e'] },
      stroke: { lineCap: 'round' },
      labels: ['Cumplimiento']
    };
  }

  buildLine(tend: any[]) {
    this.line = {
      series: [{ name: '% Cumplimiento', data: tend.map((t) => t.cumplimiento) }],
      chart: { type: 'line', height: 340, width: '100%', toolbar: { show: false }, zoom: { enabled: false } },
      xaxis: { categories: tend.map((t) => t.fecha), labels: { rotate: -45, style: { fontSize: '13px' } } },
      yaxis: {
        min: 0, max: 100, tickAmount: 5,
        labels: { style: { fontSize: '13px' }, formatter: (val: number) => Math.round(val) + '%' }
      },
      stroke: { curve: 'smooth', width: 3 },
      colors: ['#3b82f6'],
      markers: { size: 5 },
      tooltip: { style: { fontSize: '13px' } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#eef0f3' },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: { height: 260 },
            markers: { size: 0 },
            xaxis: { labels: { rotate: -90, style: { fontSize: '11px' } } }
          }
        }
      ]
    };
  }

}
