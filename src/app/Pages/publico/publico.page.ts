import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/Services/api.service';

// Vista PÚBLICA de solo lectura de un tablero compartido.
// Toma el token del link, pide los datos al backend (POST /dashboard/shared) y
// renderiza la pantalla correspondiente en modo solo lectura.
// Si el creador habilitó filtros interactivos, se muestran arriba (la FECHA nunca cambia).
@Component({
  selector: 'app-publico',
  templateUrl: './publico.page.html',
  styleUrls: ['./publico.page.scss'],
})
export class PublicoPage implements OnInit, OnDestroy {

  token = '';
  loading = true;         // carga inicial (bloquea toda la vista)
  recargando = false;     // recarga por cambio de filtro (mantiene la pantalla montada)
  error = '';

  requierePassword = false;
  password = '';

  pantalla = '';
  nombre = '';
  datos: any = null;

  // Filtros interactivos
  interactivos: any = {};       // { prioridad, unidad, tipo, motivo, turno, origen, destino } -> 1/0
  motivos: any[] = [];
  ubicaciones: any[] = [];      // para los selects ORIGEN / DESTINO (solo si son interactivos)
  fVals: any = { Prioridad: 'todos', Unidad: 'todos', Tipo: 'camilleria', Motivo: '', Turno: 'todos', Origenes: [], Destinos: [] };

  prioridadOpts = [
    { v: 'todos', l: 'Todos' },
    { v: 'critico', l: 'Crítico' },
    { v: 'nocritico', l: 'No crítico' }
  ];
  unidadOpts = [
    { v: 'todos', l: 'Todos' },
    { v: 'Adultos', l: 'Adultos' },
    { v: 'Infantil', l: 'Infantil' },
    { v: 'Alta complejidad', l: 'Alta complejidad' },
    { v: 'Medicina privada', l: 'Medicina privada' }
  ];
  tipoOpts = [
    { v: 'camilleria', l: 'Camillería' },
    { v: 'admin', l: 'Administrativas' },
    { v: 'todos', l: 'Todos' }
  ];
  turnoOpts = [
    { v: 'todos', l: 'Todos' },
    { v: 'dia', l: 'Día' },
    { v: 'noche', l: 'Noche' }
  ];

  // Deterrentes básicos contra "curiosear" desde el navegador (no es seguridad real)
  private bloquearMenu = (e: MouseEvent) => e.preventDefault();
  private bloquearTeclas = (e: KeyboardEvent) => {
    const k = (e.key || '').toLowerCase();
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
      (e.ctrlKey && k === 'u')
    ) {
      e.preventDefault();
    }
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) { }

  ngOnInit() {
    document.addEventListener('contextmenu', this.bloquearMenu);
    document.addEventListener('keydown', this.bloquearTeclas);

    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.loading = false;
      this.error = 'Link inválido.';
      return;
    }
    this.cargar(true);
  }

  ngOnDestroy() {
    document.removeEventListener('contextmenu', this.bloquearMenu);
    document.removeEventListener('keydown', this.bloquearTeclas);
  }

  // ¿Hay al menos un filtro interactivo habilitado?
  get hayFiltros(): boolean {
    return !!(this.interactivos && Object.keys(this.interactivos).some(k => this.interactivos[k]));
  }

  // Indicador: ¿este filtro tiene un valor aplicado (distinto del "todos"/default)?
  filtroActivo(key: string): boolean {
    switch (key) {
      case 'prioridad': return this.fVals.Prioridad !== 'todos';
      case 'unidad': return this.fVals.Unidad !== 'todos';
      case 'turno': return this.fVals.Turno !== 'todos';
      case 'motivo': return !!this.fVals.Motivo;
      case 'tipo': return this.fVals.Tipo !== 'camilleria';
      case 'origen': return this.fVals.Origenes.length > 0;
      case 'destino': return this.fVals.Destinos.length > 0;
      default: return false;
    }
  }

  // Cantidad de filtros aplicados (para el resumen)
  get filtrosActivosCount(): number {
    return ['prioridad', 'unidad', 'origen', 'destino', 'turno', 'motivo', 'tipo']
      .filter(k => this.interactivos[k] && this.filtroActivo(k)).length;
  }

  // Nombre del motivo seleccionado (para el chip)
  get motivoNombre(): string {
    const m = this.motivos.find(x => x._id === this.fVals.Motivo);
    return m ? m.Name : '';
  }

  // Nombres de las ubicaciones seleccionadas (para el chip): las dos primeras y "+N".
  nombresUbic(ids: string[]): string {
    const nombres = (ids || []).map((id) => {
      const u = this.ubicaciones.find((x) => x._id === id);
      return u ? u.Name : '';
    }).filter(Boolean);
    if (nombres.length <= 2) return nombres.join(', ');
    return nombres.slice(0, 2).join(', ') + ' +' + (nombres.length - 2);
  }

  async cargar(inicial: boolean) {
    if (inicial) this.loading = true; else this.recargando = true;
    this.error = '';

    const body: any = { token: this.token };
    if (this.password) body.password = this.password;
    // En recargas por filtro, manda los valores actuales (el back solo aplica los permitidos)
    if (!inicial) body.overrides = { ...this.fVals };

    const rs: any = await this.api.apiPost('dashboard/shared', body);

    this.loading = false;
    this.recargando = false;

    if (!rs) { this.error = 'No se pudo cargar el tablero.'; return; }

    if (!rs.status) {
      if (rs.requierePassword) {
        this.requierePassword = true;
        this.error = this.password ? (rs.err || 'Clave incorrecta') : '';
        return;
      }
      this.error = rs.err || 'No se pudo cargar el tablero.';
      return;
    }

    this.requierePassword = false;
    this.error = '';
    this.pantalla = rs.pantalla;
    this.nombre = rs.nombre || '';
    this.interactivos = rs.filtrosInteractivos || {};
    this.motivos = rs.motivos || [];
    this.ubicaciones = rs.ubicaciones || [];

    // Sincroniza los controles con los filtros efectivos
    const f = rs.filtros || {};
    this.fVals = {
      Prioridad: f.Prioridad || 'todos',
      Unidad: f.Unidad || 'todos',
      Tipo: f.Tipo || 'camilleria',
      Motivo: f.Motivo || '',
      Turno: f.Turno || 'todos',
      Origenes: Array.isArray(f.Origenes) ? f.Origenes : [],
      Destinos: Array.isArray(f.Destinos) ? f.Destinos : []
    };

    // Nueva referencia para disparar ngOnChanges en el componente de pantalla
    this.datos = { ...rs.response };
  }

  validarPassword() {
    if (!this.password) return;
    this.cargar(true);
  }

  // Cambio de un filtro interactivo -> recarga trayendo nuevos datos
  cambiarFiltro() {
    this.cargar(false);
  }

  setOrigenes(v: string[]) {
    this.fVals.Origenes = v;
    this.cambiarFiltro();
  }

  setDestinos(v: string[]) {
    this.fVals.Destinos = v;
    this.cambiarFiltro();
  }
}
