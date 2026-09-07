import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { StorageWebService } from './storage.service';
import { ObserverService } from './observer.service';

export interface PermisosDashboard {
  Dashboard: number;
  DashboardPages: string[];
}

// Permisos del dashboard de Indicadores (Users.Dashboard y Users.DashboardPages).
// La central los asigna desde Control de Usuarios y el front los lee del login
// guardado en el storage, asi que sin releerlos el usuario no ve el cambio hasta
// recargar el navegador. Aca se releen del API en cada punto de entrada (arranque,
// guard del dashboard, entrada a Indicadores y al asignarselos uno mismo) y se
// vuelven a guardar, para que un permiso recien dado (o quitado) aplique de una.
@Injectable({ providedIn: 'root' })
export class PermisosService {

  // El guard y la pagina entran uno detras del otro: dentro de esta ventana se
  // reusa la ultima respuesta en vez de pedirle dos veces lo mismo al API.
  private static readonly VENTANA_MS = 5000;

  private enCurso: Promise<PermisosDashboard> = null;
  private ultima = 0;
  private cache: PermisosDashboard = null;

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private obs: ObserverService
  ) { }

  // Lo que hay en el login guardado, sin tocar el API.
  async guardados(): Promise<PermisosDashboard> {
    const login = await this.stg.getLogin();

    if (!login || login.length === 0) return { Dashboard: 0, DashboardPages: [] };

    return {
      Dashboard: login[0].Dashboard == 1 ? 1 : 0,
      DashboardPages: Array.isArray(login[0].DashboardPages) ? login[0].DashboardPages : []
    };
  }

  // Relee los permisos del API y los deja en el storage. Si el API no responde se
  // devuelve lo guardado: no se le quita el acceso por un error de red.
  refrescar(forzar = false): Promise<PermisosDashboard> {
    if (this.enCurso) return this.enCurso;

    if (!forzar && this.cache && Date.now() - this.ultima < PermisosService.VENTANA_MS) {
      return Promise.resolve(this.cache);
    }

    this.enCurso = this.consultar().then((permisos) => {
      this.cache = permisos;
      this.ultima = Date.now();
      this.enCurso = null;
      return permisos;
    }).catch(() => {
      this.enCurso = null;
      return this.guardados();
    });

    return this.enCurso;
  }

  // Se llama al cerrar sesion: el siguiente usuario no puede heredar la ventana.
  limpiar() {
    this.cache = null;
    this.ultima = 0;
  }

  private async consultar(): Promise<PermisosDashboard> {
    const login = await this.stg.getLogin();

    if (!login || login.length === 0) return { Dashboard: 0, DashboardPages: [] };

    const rs: any = await this.api.apiGet('misPermisos', login[0].token);

    // Sin respuesta util (API caido o token vencido): se conserva lo guardado.
    if (!rs || !rs.status || !rs.response) return this.guardados();

    const permisos: PermisosDashboard = {
      Dashboard: rs.response.Dashboard == 1 ? 1 : 0,
      DashboardPages: Array.isArray(rs.response.DashboardPages) ? rs.response.DashboardPages : []
    };

    await this.stg.putPermisosDashboard(permisos.Dashboard, permisos.DashboardPages);

    // El menu lateral lo escucha para mostrar u ocultar Indicadores en el momento.
    this.obs.permisosDashboard(permisos);

    return permisos;
  }
}
