import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as XLSX from 'xlsx';

// Descarga la data cruda (desnormalizada) con la que se construyó cada indicador.
@Injectable({ providedIn: 'root' })
export class DashboardExcelService {

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService
  ) { }

  // filtros: el body de filtros de la pantalla (Desde/Hasta/Tipo/Prioridad/Unidad/Motivo/Turno/Destinos/Origenes)
  async descargar(filtros: any, filename: string) {
    const login = await this.stg.getLogin();
    if (!login) return;

    const body: any = {
      token: login[0].token,
      WorkZoneID: login[0].WorkZone,
      Format: 'America/Bogota',
      ...filtros
    };

    this.toast.MsgOK('Generando Excel…');
    const rs: any = await this.api.apiPost('dashboard/rawdata', body);

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo generar el Excel');
      return;
    }
    const rows = (rs.response && rs.response.rows) || [];
    if (!rows.length) {
      this.toast.MsgError('Sin datos para exportar con esos filtros');
      return;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Datos');
    XLSX.writeFile(wb, filename);
  }
}
