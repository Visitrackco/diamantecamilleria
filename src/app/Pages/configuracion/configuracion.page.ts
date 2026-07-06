import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
})
export class ConfiguracionPage implements OnInit {

  loading = false;
  loaded = false;

  config = {
    MetaCumplimiento: 90,
    TurnoDiaInicio: '06:00',
    TurnoDiaFin: '18:00',
    TurnoNocheInicio: '18:00',
    TurnoNocheFin: '06:00'
  };

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService
  ) { }

  ngOnInit() { }

  async ionViewWillEnter() {
    await this.getConfig();
  }

  async getConfig() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loaded = false;
    try {
      const rs: any = await this.api.apiGet(
        'configuracion?WorkZoneID=' + login[0].WorkZone,
        login[0].token
      );

      if (rs && rs.status && rs.response) {
        const r = rs.response;
        this.config = {
          MetaCumplimiento: r.MetaCumplimiento ?? 90,
          TurnoDiaInicio: r.TurnoDiaInicio || '06:00',
          TurnoDiaFin: r.TurnoDiaFin || '18:00',
          TurnoNocheInicio: r.TurnoNocheInicio || '18:00',
          TurnoNocheFin: r.TurnoNocheFin || '06:00'
        };
      }
    } catch (error) {
      this.toast.MsgError('No se pudo cargar la configuración');
    }
    this.loaded = true;
  }

  async save() {
    const meta = Number(this.config.MetaCumplimiento);
    if (isNaN(meta) || meta < 0 || meta > 100) {
      this.toast.MsgError('La meta de cumplimiento debe estar entre 0 y 100');
      return;
    }

    if (!this.config.TurnoDiaInicio || !this.config.TurnoDiaFin ||
        !this.config.TurnoNocheInicio || !this.config.TurnoNocheFin) {
      this.toast.MsgError('Debe definir los horarios de ambos turnos');
      return;
    }

    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;
    try {
      const rs: any = await this.api.apiPost('configuracion', {
        token: login[0].token,
        WorkZoneID: login[0].WorkZone,
        MetaCumplimiento: meta,
        TurnoDiaInicio: this.config.TurnoDiaInicio,
        TurnoDiaFin: this.config.TurnoDiaFin,
        TurnoNocheInicio: this.config.TurnoNocheInicio,
        TurnoNocheFin: this.config.TurnoNocheFin
      });

      this.loading = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'Error al guardar la configuración');
        return;
      }

      this.toast.MsgOK('Configuración guardada');
    } catch (error) {
      this.loading = false;
      this.toast.MsgError('Error al guardar la configuración');
    }
  }

}
