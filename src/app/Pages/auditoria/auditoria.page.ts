import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';
import { AyudaAuditoriaComponent } from './ayuda-auditoria/ayuda-auditoria.component';

interface PresetRango {
  key: string;
  label: string;
  horas: number | null;
}

const TZ = 'America/Bogota';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.page.html',
  styleUrls: ['./auditoria.page.scss'],
})
export class AuditoriaPage implements OnInit {

  loading = false;

  preset = '24h';
  presets: PresetRango[] = [
    { key: 'hoy', label: 'Hoy', horas: null },
    { key: '24h', label: 'Últimas 24 horas', horas: 24 },
    { key: '3d', label: 'Últimos 3 días', horas: 24 * 3 },
    { key: '7d', label: 'Últimos 7 días', horas: 24 * 7 }
  ];

  // Rango seleccionado (máximo permitido: 1 semana)
  desde: Date = null;
  hasta: Date = null;

  resumen: any = null;
  porEndpoint: any[] = [];
  buckets: any[] = [];

  llamadasChart: any = null;
  memoriaChart: any = null;
  cpuChart: any = null;
  topServiciosChart: any = null;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.aplicarPreset('24h');
  }

  async ayuda() {
    const modal = await this.modalCtrl.create({
      component: AyudaAuditoriaComponent
    });
    await modal.present();
  }

  aplicarPreset(key: string) {
    this.preset = key;
    const ahora = moment.tz(TZ);

    if (key === 'hoy') {
      this.desde = ahora.clone().startOf('day').toDate();
      this.hasta = ahora.clone().toDate();
    } else {
      const p = this.presets.find((x) => x.key === key);
      this.hasta = ahora.toDate();
      this.desde = ahora.clone().subtract(p.horas, 'hours').toDate();
    }

    this.cargar();
  }

  // El rango manual (datepickers) tambien se limita a 1 semana como maximo
  onRangoManual() {
    this.preset = null;

    if (this.desde && this.hasta) {
      const dias = moment(this.hasta).diff(moment(this.desde), 'days', true);
      if (dias > 7) {
        this.desde = moment(this.hasta).subtract(7, 'days').toDate();
        this.toast.MsgError('El rango máximo permitido es de 1 semana, se ajustó la fecha "Desde"');
      }
    }

    this.cargar();
  }

  private fmt(d: Date): string {
    return moment(d).utc().format('YYYY-MM-DD HH:mm:ss');
  }

  async cargar() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;

    const from = encodeURIComponent(this.fmt(this.desde));
    const to = encodeURIComponent(this.fmt(this.hasta));

    try {
      const [rsStats, rsHourly]: any = await Promise.all([
        this.api.apiGet(`audit/stats?from=${from}&to=${to}`, login[0].token),
        this.api.apiGet(`audit/stats/hourly?from=${from}&to=${to}`, login[0].token)
      ]);

      this.loading = false;

      if (rsStats && rsStats.status) {
        this.resumen = rsStats.response.resumen;
        this.porEndpoint = rsStats.response.porEndpoint || [];
        this.buildTopServicios();
      } else {
        this.toast.MsgError(rsStats && rsStats.err ? rsStats.err : 'No se pudieron cargar las métricas');
      }

      if (rsHourly && rsHourly.status) {
        this.buckets = rsHourly.response.buckets || [];
        this.buildTimeline();
      } else {
        this.toast.MsgError(rsHourly && rsHourly.err ? rsHourly.err : 'No se pudo cargar el detalle por hora');
      }
    } catch (e) {
      this.loading = false;
      this.toast.MsgError('Error al cargar la auditoría del sistema');
    }
  }

  // Si hay un preset activo (Hoy/24h/3d/7d), recalcula el rango contra el momento actual
  // antes de consultar - si no, es un rango manual y se re-consulta tal cual esta.
  recargar() {
    if (this.preset) {
      this.aplicarPreset(this.preset);
    } else {
      this.cargar();
    }
  }

  private buildTimeline() {
    const categorias = this.buckets.map((b) => moment(b.hora).format('DD/MM HH:[00]'));

    const base = {
      chart: { height: 200, toolbar: { show: false }, zoom: { enabled: false } },
      xaxis: { categories: categorias, labels: { rotate: -45, style: { fontSize: '9px' } } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#eef0f3' },
      markers: { size: 0 }
    };

    this.llamadasChart = {
      ...base,
      series: [{ name: 'Llamadas', data: this.buckets.map((b) => b.llamadas) }],
      chart: { ...base.chart, type: 'area' },
      yaxis: { labels: { formatter: (v: number) => Math.round(v) } },
      colors: ['#2a78d6']
    };

    this.memoriaChart = {
      ...base,
      series: [{ name: 'Memoria RSS (MB)', data: this.buckets.map((b) => b.memoriaPromedioMB) }],
      chart: { ...base.chart, type: 'area' },
      yaxis: { labels: { formatter: (v: number) => Math.round(v) } },
      colors: ['#1baf7a']
    };

    this.cpuChart = {
      ...base,
      series: [{ name: '% CPU', data: this.buckets.map((b) => b.cpuPromedio) }],
      chart: { ...base.chart, type: 'area' },
      yaxis: { labels: { formatter: (v: number) => v.toFixed(1) + '%' } },
      colors: ['#4a3aa7']
    };
  }

  private buildTopServicios() {
    const top = [...this.porEndpoint].sort((a, b) => b.llamadas - a.llamadas).slice(0, 10);

    this.topServiciosChart = {
      series: [{ name: 'Llamadas', data: top.map((t) => t.llamadas) }],
      chart: { type: 'bar', height: Math.max(220, top.length * 34), toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
      xaxis: { categories: top.map((t) => t.Method + ' ' + t.Path) },
      colors: ['#2a78d6'],
      dataLabels: { enabled: true, style: { fontSize: '10px' } },
      grid: { borderColor: '#eef0f3' }
    };
  }

  // Horas con trafico, para la tabla "servicio mas llamado por hora"
  get bucketsConTop() {
    return this.buckets.filter((b) => b.llamadas > 0).slice().reverse();
  }

  // Umbrales de tiempo de respuesta (ms). El maximo tolera valores mas altos que el promedio.
  claseTiempo(ms: number, esMax = false): string {
    if (ms == null) return '';
    const critico = esMax ? 3000 : 1000;
    const demorado = esMax ? 1200 : 400;
    if (ms >= critico) return 'aud-crit';
    if (ms >= demorado) return 'aud-warn';
    return '';
  }

  // Umbral de memoria RSS (MB) del proceso del backend
  claseMemoria(mb: number): string {
    if (mb == null) return '';
    if (mb >= 400) return 'aud-crit';
    if (mb >= 250) return 'aud-warn';
    return '';
  }

  // Recalcula Total/Pendiente de los camilleros conectados (1) o en descanso (0.5)
  async recalcularConteos() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;
    const rs: any = await this.api.apiPost('recalcularConteos', { token: login[0].token });
    this.loading = false;

    if (rs && rs.status) {
      this.toast.MsgOK(`Se recalcularon ${rs.response.actualizados} de ${rs.response.total} camilleros conectados/en descanso`);
    } else {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo recalcular');
    }
  }

  async purgar() {
    const alert = await this.alertCtrl.create({
      header: 'Purgar logs de auditoría',
      message: 'Esta acción borra permanentemente los registros. Deja el campo vacío para borrar TODOS los registros, o indica hace cuántos días purgar (ej: 7).',
      inputs: [{ name: 'dias', type: 'number', placeholder: 'Días (opcional)' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Purgar',
          role: 'destructive',
          handler: async (data) => {
            const login = await this.stg.getLogin();
            if (!login) return;

            const dias = data.dias ? parseFloat(data.dias) : null;
            const rs: any = await this.api.apiDelete('audit/purge' + (dias ? '?days=' + dias : ''), login[0].token);

            if (rs && rs.status) {
              this.toast.MsgOK('Se eliminaron ' + rs.response.eliminados + ' registros');
              this.cargar();
            } else {
              this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo purgar');
            }
          }
        }
      ]
    });

    await alert.present();
  }

}
