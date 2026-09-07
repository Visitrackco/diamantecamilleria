import { Injectable } from '@angular/core';
import { StorageWebService } from './storage.service';

export interface UnidadOpt {
  v: string;
  l: string;
}

// Clinicas habilitadas y los grupos de ubicacion que existen en cada una.
// Los textos de `grupos` tienen que escribirse igual que en Locations.Grupo
// (ver normalizeGrupo en ubicaciones.page.ts) y que en GRUPOS_UNIDAD del backend,
// porque el reporte cruza por texto exacto.
const CLINICAS = {
  6842: { nombre: 'MEDELLIN', grupos: ['Adultos', 'Infantil'] },
  6993: { nombre: 'RIONEGRO', grupos: ['Alta complejidad', 'Medicina privada'] },
  1001: { nombre: 'PRUEBAS', grupos: ['Adultos', 'Infantil', 'Alta complejidad', 'Medicina privada'] }
};

const TODOS_LOS_GRUPOS = ['Adultos', 'Infantil', 'Alta complejidad', 'Medicina privada'];

@Injectable({ providedIn: 'root' })
export class ClinicaService {

  constructor(
    private stg: StorageWebService
  ) { }

  // Zona de trabajo activa (la misma que se manda como WorkZoneID en todos los reportes).
  async zona(): Promise<number> {
    const login = await this.stg.getLogin();
    return login && login.length > 0 ? Number(login[0].WorkZone) : 0;
  }

  // Nombre de la clinica en la que esta parado el usuario ('' si no hay sesion).
  async nombre(): Promise<string> {
    const c = CLINICAS[await this.zona()];
    return c ? c.nombre : '';
  }

  // Grupos del filtro UNIDAD DEFINITIVA que aplican a la clinica actual.
  async grupos(): Promise<string[]> {
    const c = CLINICAS[await this.zona()];
    return c ? c.grupos : TODOS_LOS_GRUPOS;
  }

  // Opciones listas para pintar el slicer UNIDAD.
  // `mayus` para las pantallas que muestran las etiquetas en mayuscula sostenida.
  async unidadOpts(todosLabel = 'Seleccionar todo', mayus = true): Promise<UnidadOpt[]> {
    const grupos = await this.grupos();
    return [
      { v: 'todos', l: todosLabel },
      ...grupos.map((g) => ({ v: g, l: mayus ? g.toUpperCase() : g }))
    ];
  }

  // Ajusta el slicer a la clinica actual. Devuelve las opciones validas y el valor
  // que debe quedar seleccionado: si el que traia el filtro compartido no existe en
  // esta clinica (p.ej. venir de Medellin con 'Adultos' y cambiarse a Rionegro),
  // cae a 'todos' para no consultar con una unidad que no aplica.
  async unidadPara(unidadActual: string, todosLabel = 'Seleccionar todo', mayus = true) {
    const opts = await this.unidadOpts(todosLabel, mayus);
    const valida = opts.some((o) => o.v === unidadActual);
    return { opts, unidad: valida ? unidadActual : 'todos' };
  }

}
