import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';

interface Motivo {
  _id: string;
  Name: string;
}

interface Location {
  _id: string;
  Name: string;
}

interface Perfil {
  _id?: string;
  Name: string;
  WorkZoneID?: number;
  Motivos: Motivo[] | string[];
  Origenes?: Location[] | string[];
  Destinos?: Location[] | string[];
}

@Component({
  selector: 'app-perfiles',
  templateUrl: './perfiles.page.html',
  styleUrls: ['./perfiles.page.scss'],
})
export class PerfilesPage implements OnInit {

  displayedColumns = ['name', 'coh', 'motivos', 'origenes', 'destinos', 'acc'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild('paginatorPerfil') paginator: MatPaginator;

  loadActivities = false;
  loading = false;

  motivos: Motivo[] = [];
  locations: Location[] = [];

  showForm = false;
  editingId: string | null = null;
  formName = '';
  formMotivos: string[] = [];
  formOrigenes: string[] = [];
  formDestinos: string[] = [];
  formIsCOH = false;

  origenesSearch = '';
  destinosSearch = '';

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() { }

  async ionViewWillEnter() {
    await this.loadMotivos();
    await this.loadLocations();
    await this.getPerfiles();
  }

  async loadMotivos() {
    const login = await this.stg.getLogin();
    if (!login) return;

    const rs: any = await this.api.apiGet(
      'motivos?WorkZoneID=' + login[0].WorkZone,
      login[0].token
    );
    if (rs && rs.status) {
      this.motivos = rs.response || [];
    }
  }

  async loadLocations() {
    const login = await this.stg.getLogin();
    if (!login) return;

    const rs: any = await this.api.apiGet(
      'locations?WorkZoneID=' + login[0].WorkZone,
      login[0].token
    );
    if (rs && rs.status) {
      this.locations = rs.response || [];
    }
  }

  async getPerfiles() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loadActivities = false;
    this.dataSource.data = [];

    const rs: any = await this.api.apiGet(
      'perfiles?WorkZoneID=' + login[0].WorkZone,
      login[0].token
    );

    if (rs && rs.status) {
      const fila = (rs.response || []).map((p: any) => {
        const motivos = this.previewNames((p.Motivos || []).map((m: any) => m.Name));
        const origenes = this.previewNames((p.Origenes || []).map((o: any) => o.Name));
        const destinos = this.previewNames((p.Destinos || []).map((d: any) => d.Name));
        return {
          name: p.Name,
          motivos: motivos.text,
          motivosExtra: motivos.extra,
          motivosCount: (p.Motivos || []).length,
          origenes: origenes.text,
          origenesExtra: origenes.extra,
          origenesCount: (p.Origenes || []).length,
          destinos: destinos.text,
          destinosExtra: destinos.extra,
          destinosCount: (p.Destinos || []).length,
          isCOH: p.isCOH ? 1 : 0,
          acc: p
        };
      });
      this.dataSource.data = fila;
      this.dataSource.paginator = this.paginator;
    }
    this.loadActivities = true;
  }

  filterLocations(term: string, selected: string[] = []): Location[] {
    const t = (term || '').trim().toLowerCase();
    if (!t) return this.locations;
    const sel = selected || [];
    return this.locations.filter(
      (l) => (l.Name || '').toLowerCase().includes(t) || sel.includes(l._id)
    );
  }

  previewNames(names: string[], visible: number = 2): { text: string; extra: number } {
    const list = names || [];
    const text = list.slice(0, visible).join(', ');
    const extra = Math.max(0, list.length - visible);
    return { text, extra };
  }

  filtrar(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  cancel() {
    this.dataSource.filter = '';
  }

  newPerfil() {
    this.editingId = null;
    this.formName = '';
    this.formMotivos = [];
    this.formOrigenes = [];
    this.formDestinos = [];
    this.formIsCOH = false;
    this.showForm = true;
  }

  editPerfil(perfil: any) {
    this.editingId = perfil._id;
    this.formName = perfil.Name;
    this.formIsCOH = perfil.isCOH ? true : false;
    this.formMotivos = (perfil.Motivos || []).map((m: any) =>
      typeof m === 'string' ? m : m._id
    );
    this.formOrigenes = (perfil.Origenes || []).map((o: any) =>
      typeof o === 'string' ? o : o._id
    );
    this.formDestinos = (perfil.Destinos || []).map((d: any) =>
      typeof d === 'string' ? d : d._id
    );
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.formName = '';
    this.formMotivos = [];
    this.formOrigenes = [];
    this.formDestinos = [];
    this.formIsCOH = false;
    this.origenesSearch = '';
    this.destinosSearch = '';
  }

  async savePerfil() {
    if (!this.formName || !this.formName.trim()) {
      this.toast.MsgError('El nombre del perfil es requerido');
      return;
    }
    if (!this.formMotivos.length) {
      this.toast.MsgError('Debe seleccionar al menos un motivo');
      return;
    }

    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;

    const payload: any = {
      token: login[0].token,
      Name: this.formName.trim(),
      Motivos: this.formMotivos,
      Origenes: this.formOrigenes,
      Destinos: this.formDestinos,
      isCOH: this.formIsCOH ? 1 : 0,
      WorkZoneID: login[0].WorkZone
    };

    let rs: any;
    if (this.editingId) {
      payload._id = this.editingId;
      rs = await this.api.apiPost('perfilesEdit', payload);
    } else {
      rs = await this.api.apiPost('perfiles', payload);
    }

    this.loading = false;

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'Error al guardar el perfil');
      return;
    }

    this.toast.MsgOK(this.editingId ? 'Perfil modificado' : 'Perfil creado');
    this.closeForm();
    this.getPerfiles();
  }

  async deletePerfil(perfil: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar ' + perfil.Name,
      message: 'Una vez aceptado, el perfil se eliminará y los usuarios asignados a este perfil quedarán sin perfil.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aceptar',
          handler: async () => {
            const login = await this.stg.getLogin();
            if (!login) return;

            this.loading = true;
            const rs: any = await this.api.apiDelete(
              'perfiles?_id=' + perfil._id,
              login[0].token
            );
            this.loading = false;

            if (!rs || !rs.status) {
              this.toast.MsgError(rs && rs.err ? rs.err : 'Error al eliminar');
              return;
            }
            this.toast.MsgOK('Perfil eliminado');
            this.getPerfiles();
          }
        }
      ]
    });
    await alert.present();
  }

  ionViewWillLeave() {
    this.dataSource.data = [];
    this.closeForm();
  }
}
