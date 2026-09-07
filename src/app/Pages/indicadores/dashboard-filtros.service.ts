import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';

// Opciones del selector de HORA (formato 24h / militar), cada 30 minutos.
// Se comparte entre todas las páginas del dashboard para no repetir el generador.
export const HORAS_OPTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

// Filtros compartidos entre las páginas del dashboard (Indicadores).
// Cada página los lee al entrar (ngOnInit) y los guarda al consultar (cargar),
// así un filtro seleccionado en una pantalla se hereda en las demás.
@Injectable({ providedIn: 'root' })
export class DashboardFiltrosService {

  desde: Date = moment().startOf('day').toDate();
  hasta: Date = moment().startOf('day').toDate();
  horaFrom = '00:00';
  horaTo = '23:30';
  prioridad = 'todos';
  unidad = 'todos';
  tipo = 'camilleria';
  motivo = '';
  turno = 'todos';

  reset() {
    this.desde = moment().startOf('day').toDate();
    this.hasta = moment().startOf('day').toDate();
    this.horaFrom = '00:00';
    this.horaTo = '23:30';
    this.prioridad = 'todos';
    this.unidad = 'todos';
    this.tipo = 'camilleria';
    this.motivo = '';
    this.turno = 'todos';
  }
}
