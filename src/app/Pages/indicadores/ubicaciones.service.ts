import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';

// Ubicaciones de la zona para los filtros ORIGEN / DESTINO del dashboard.
// Todas las pantallas usan la misma lista, asi que se pide una sola vez por zona.
// El dashboard la invalida en cada entrada (indicadores.page.ts) para que una
// ubicacion recien creada aparezca sin recargar el navegador.
@Injectable({ providedIn: 'root' })
export class UbicacionesService {

  private zona = 0;
  private cache: Promise<any[]> = null;

  constructor(
    private api: ApiService,
    private stg: StorageWebService
  ) { }

  async lista(): Promise<any[]> {
    const login = await this.stg.getLogin();
    if (!login || !login.length) return [];

    const zona = Number(login[0].WorkZone);
    if (!this.cache || this.zona !== zona) {
      this.zona = zona;
      this.cache = Promise.resolve(this.api.apiGet('locations?WorkZoneID=' + zona, login[0].token))
        .then((rs: any) => {
          if (rs && rs.status) return rs.response || [];
          this.cache = null;   // si fallo, la siguiente pantalla vuelve a intentar
          return [];
        })
        .catch(() => {
          this.cache = null;
          return [];
        });
    }
    return this.cache;
  }

  invalidar() {
    this.cache = null;
  }
}
