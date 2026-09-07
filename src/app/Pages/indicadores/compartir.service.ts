import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

export interface CompartirEstado {
  abierto: boolean;
  paso: 'form' | 'listo';     // form = pedir datos; listo = mostrar link generado
  nombre: string;
  publico: boolean;           // true = público, false = requiere clave
  password: string;
  generando: boolean;
  error: string;
  link: string;
  copiado: boolean;
  filtrosDisponibles: { key: string; label: string }[];  // filtros configurables de la pantalla
  interactivos: { [k: string]: boolean };                 // cuáles podrá cambiar el público
}

// Filtros que cada pantalla permite volver interactivos en el link (la FECHA nunca).
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
  ],
  nfc: [
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'unidad', label: 'Unidad definitiva' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'tipo', label: 'Tipo' }
  ],
  // La HORA no es interactiva en el link: queda fija con la selección de quien comparte.
  cantidad: [
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'unidad', label: 'Unidad definitiva' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'tipo', label: 'Tipo' }
  ]
};

// Maneja el diálogo (bonito, sin Ionic) para generar links públicos del dashboard (shareScreen).
// El estado lo consume `CompartirDialogComponent`, que se monta una sola vez en el shell.
@Injectable({ providedIn: 'root' })
export class CompartirService {

  private pantalla = '';
  private filtros: any = {};

  private _estado = new BehaviorSubject<CompartirEstado>(this.inicial());
  estado$ = this._estado.asObservable();

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService
  ) { }

  private inicial(): CompartirEstado {
    return {
      abierto: false,
      paso: 'form',
      nombre: '',
      publico: true,
      password: '',
      generando: false,
      error: '',
      link: '',
      copiado: false,
      filtrosDisponibles: [],
      interactivos: {}
    };
  }

  private set(parcial: Partial<CompartirEstado>) {
    this._estado.next({ ...this._estado.value, ...parcial });
  }

  // Abre el diálogo para la pantalla + filtros indicados
  compartir(pantalla: string, filtros: any) {
    this.pantalla = pantalla;
    this.filtros = filtros || {};
    const disp = FILTROS_POR_PANTALLA[pantalla] || [];
    const interactivos: { [k: string]: boolean } = {};
    disp.forEach(f => interactivos[f.key] = false);   // por default TODOS deshabilitados
    this._estado.next({
      ...this.inicial(),
      abierto: true,
      filtrosDisponibles: disp,
      interactivos
    });
  }

  cerrar() {
    this._estado.next(this.inicial());
  }

  setNombre(v: string) { this.set({ nombre: v }); }
  setPublico(v: boolean) { this.set({ publico: v, error: '' }); }
  setPassword(v: string) { this.set({ password: v }); }
  setInteractivo(key: string, v: boolean) {
    this.set({ interactivos: { ...this._estado.value.interactivos, [key]: v } });
  }

  // Genera el link (POST /dashboard/share)
  async generar() {
    const st = this._estado.value;

    if (!st.publico && !st.password.trim()) {
      this.set({ error: 'Ingresa una clave o activa "Público".' });
      return;
    }

    const login = await this.stg.getLogin();
    if (!login) { this.set({ error: 'Sesión no válida.' }); return; }

    this.set({ generando: true, error: '' });

    const body: any = {
      token: login[0].token,
      WorkZoneID: login[0].WorkZone,
      pantalla: this.pantalla,
      filtros: this.filtros,
      filtrosInteractivos: st.interactivos,
      Nombre: st.nombre.trim(),
      publico: st.publico ? 1 : 0,
      password: st.publico ? '' : st.password.trim()
    };

    const rs: any = await this.api.apiPost('dashboard/share', body);

    if (!rs || !rs.status) {
      this.set({ generando: false, error: (rs && rs.err) || 'No se pudo crear el link' });
      return;
    }

    const base = window.location.origin + window.location.pathname;
    const url = base + '#/ver/' + rs.token;

    let copiado = false;
    try { await navigator.clipboard.writeText(url); copiado = true; } catch (e) { }

    this.set({ generando: false, paso: 'listo', link: url, copiado });
  }

  async copiar() {
    const url = this._estado.value.link;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.set({ copiado: true });
      this.toast.MsgOK('Link copiado');
    } catch (e) {
      this.toast.MsgError('No se pudo copiar');
    }
  }
}
