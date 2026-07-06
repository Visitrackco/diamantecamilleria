import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';

// Filtros compartidos entre las páginas del dashboard (Indicadores).
// Cada página los lee al entrar (ngOnInit) y los guarda al consultar (cargar),
// así un filtro seleccionado en una pantalla se hereda en las demás.
@Injectable({ providedIn: 'root' })
export class DashboardFiltrosService {

  desde: Date = moment().startOf('day').toDate();
  hasta: Date = moment().startOf('day').toDate();
  prioridad = 'todos';
  unidad = 'todos';
  tipo = 'camilleria';
  motivo = '';
  turno = 'todos';

  reset() {
    this.desde = moment().startOf('day').toDate();
    this.hasta = moment().startOf('day').toDate();
    this.prioridad = 'todos';
    this.unidad = 'todos';
    this.tipo = 'camilleria';
    this.motivo = '';
    this.turno = 'todos';
  }
}
