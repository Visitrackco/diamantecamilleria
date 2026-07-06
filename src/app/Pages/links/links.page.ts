import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone';

// Filtros que cada pantalla permite volver interactivos (la FECHA nunca).
const FILTROS_POR_PANTALLA: { [p: string]: { key: string; label: string }[] } = {
  camilleria: [
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'unidad', label: 'Unidad definitiva' },
    { key: 'tipo', label: 'Tipo' }
  ],
  camilleria2: [
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'unidad', label: 'Unidad definitiva' },
    { key: 'turno', label: 'Turno' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'tipo', label: 'Tipo' }
  ],
  mapacalor: [
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'unidad', label: 'Unidad definitiva' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'tipo', label: 'Tipo' }
  ],
  mapacumplimiento: [
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'unidad', label: 'Unidad definitiva' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'tipo', label: 'Tipo' }
  ],
  camilleria4: [
    { key: 'unidad', label: 'Unidad definitiva' },
    { key: 'tipo', label: 'Tipo' }
  ]
};

// Administración de links compartidos del dashboard (solo personal con todos los permisos).
@Component({
  selector: 'app-links',
  templateUrl: './links.page.html',
  styleUrls: ['./links.page.scss'],
})
export class LinksPage implements OnInit {

  loading = false;
  links: any[] = [];

  // Edición
  editando: any = null;             // copia del link en edición
  filtrosEdit: { key: string; label: string }[] = [];
  guardando = false;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;
    const rs: any = await this.api.apiPost('dashboard/links', {
      token: login[0].token,
      WorkZoneID: login[0].WorkZone
    });
    this.loading = false;

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudieron cargar los links');
      return;
    }
    this.links = rs.response || [];
  }

  urlDe(token: string): string {
    return window.location.origin + window.location.pathname + '#/ver/' + token;
  }

  async copiar(l: any) {
    try {
      await navigator.clipboard.writeText(this.urlDe(l.token));
      this.toast.MsgOK('Link copiado');
    } catch (e) {
      this.toast.MsgError('No se pudo copiar');
    }
  }

  abrir(l: any) {
    window.open(this.urlDe(l.token), '_blank');
  }

  // Cantidad de filtros interactivos activos
  interactivosActivos(l: any): number {
    const fi = l.filtrosInteractivos || {};
    return Object.keys(fi).filter(k => fi[k]).length;
  }

  // Fecha guardada (UTC, límite del día en Bogotá) -> Date del día (mediodía local, sin líos de zona)
  private parseFecha(str: string): Date | null {
    if (!str) return null;
    const dia = moment.utc(str).tz('America/Bogota').format('YYYY-MM-DD');
    const p = dia.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2], 12, 0, 0);
  }

  // Date del picker -> límite del día en Bogotá expresado en UTC (igual que el dashboard)
  private fmtFecha(d: Date, fin: boolean): string {
    if (!d) return '';
    const dia = moment(d).format('YYYY-MM-DD');
    const hora = fin ? '23:59:59' : '00:00:00';
    return moment.tz(dia + ' ' + hora, 'America/Bogota').utc().format('YYYY-MM-DD HH:mm:ss');
  }

  // ---- Edición ----
  editar(l: any) {
    this.filtrosEdit = FILTROS_POR_PANTALLA[l.pantalla] || [];
    const fi: any = {};
    this.filtrosEdit.forEach(f => fi[f.key] = !!(l.filtrosInteractivos && l.filtrosInteractivos[f.key]));
    const filtros = l.filtros || {};
    this.editando = {
      _id: l._id,
      Nombre: l.Nombre || '',
      pantallaLabel: l.pantallaLabel,
      publico: l.publico === 1,
      password: '',
      interactivos: fi,
      desde: this.parseFecha(filtros.Desde),
      hasta: this.parseFecha(filtros.Hasta)
    };
  }

  cancelarEdicion() {
    this.editando = null;
    this.guardando = false;
  }

  toggleInteractivo(key: string, v: boolean) {
    this.editando.interactivos[key] = v;
  }

  async guardarEdicion() {
    const e = this.editando;
    if (!e) return;

    if (!e.publico && !e.password && !this.linkTeniaClave(e._id)) {
      this.toast.MsgError('Indica una clave para el link privado');
      return;
    }

    if (!e.desde || !e.hasta) {
      this.toast.MsgError('Indica las fechas Desde y Hasta');
      return;
    }
    if (moment(e.desde).isAfter(moment(e.hasta), 'day')) {
      this.toast.MsgError('La fecha Desde no puede ser mayor que Hasta');
      return;
    }

    const login = await this.stg.getLogin();
    if (!login) return;

    this.guardando = true;
    const rs: any = await this.api.apiPost('dashboard/links/update', {
      token: login[0].token,
      _id: e._id,
      Nombre: e.Nombre.trim(),
      publico: e.publico ? 1 : 0,
      password: e.password || '',
      filtrosInteractivos: e.interactivos,
      Desde: this.fmtFecha(e.desde, false),
      Hasta: this.fmtFecha(e.hasta, true)
    });
    this.guardando = false;

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo guardar');
      return;
    }
    this.toast.MsgOK('Link actualizado');
    this.editando = null;
    this.cargar();
  }

  // ¿El link original ya tenía clave? (para permitir guardar privado sin re-escribirla)
  private linkTeniaClave(id: string): boolean {
    const l = this.links.find(x => x._id === id);
    return !!(l && l.publico === 0);
  }

  // ---- Eliminar ----
  async eliminar(l: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar link',
      message: '¿Eliminar el link "' + (l.Nombre || l.pantallaLabel) + '"? Dejará de funcionar para quien lo tenga.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const login = await this.stg.getLogin();
            if (!login) return;
            const rs: any = await this.api.apiPost('dashboard/links/delete', {
              token: login[0].token,
              _id: l._id
            });
            if (!rs || !rs.status) {
              this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo eliminar');
              return;
            }
            this.toast.MsgOK('Link eliminado');
            this.cargar();
          }
        }
      ]
    });
    await alert.present();
  }
}
