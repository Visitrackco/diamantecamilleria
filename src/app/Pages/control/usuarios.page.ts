import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/Services/api.service';
import { SocketService } from 'src/app/Services/Sockets.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import * as moment from 'moment-timezone'
import { AlertController, NavController } from '@ionic/angular';
import { elementAt } from 'rxjs';
import { ClinicaService } from 'src/app/Services/clinica.service';
import { PermisosService } from 'src/app/Services/permisos.service';
import { BI_PAGES } from 'src/app/Pages/indicadores/bi-pages';


@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit {

  displayedColumns =
    ['estado', 'name', 'login', 'rol', 'clave', 'islock', 'isdelete', 'isassigment', 'perfil', 'dashboard', 'dashboardpages', 'central', 'centraladmin', 'programmer', 'zones', 'acc'];
  dataSource = new MatTableDataSource([]);

  perfiles: any[] = [];

  // Pantallas del dashboard que se le pueden habilitar a cada usuario. Sale de la
  // misma lista que pinta el menu del dashboard, para que no se desincronicen.
  biPages = BI_PAGES;

  @ViewChild('paginatorHistory') paginator: MatPaginator;

  loadActivities;


  loading;

  zones = [6842, 6993, 1001]

  // Descansos de la zona activa: marca a quien ya se le configuraron, para mostrarle
  // el boton solo al que le faltan. Los valores salen de ConfigDescansos en el
  // backend, aqui no se copian de nadie.
  descansosPorUsuario: any = {};
  descansosCargados = false;

  // Muestra el boton del modulo Super Admin. Se relee del API al entrar: si se lo
  // acaban de dar (o quitar) aplica sin cerrar sesion.
  superAdmin = false;

  // Central / central administrativa: solo los cambian administradores (rol 8) y
  // super admin. El API valida lo mismo (verifyCentral).
  puedeCentral = false;

  // Filtros de la consulta (servicio /controlUsuarios, exclusivo de esta pantalla:
  // /usersworkzone lo usa el movil y no se toca). Clinica vacia = todas las que
  // puede ver quien consulta; arranca en la clinica activa, como antes.
  filtroTexto = '';
  filtroRol: any = '';
  filtroZona: any = '';
  rolesFiltro: any[] = [];
  zonasFiltro: any[] = [];
  zonaActiva: number = null;
  totalUsuarios = 0;
  buscando = false;
  private buscarTimer: any = null;
  private consulta = 0;
  private catalogosZona: number = null;
  private zonesCatalogo: any[] = [];


  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private socket: SocketService,
    private alertCtrl: AlertController,
    private clinica: ClinicaService,
    private permisos: PermisosService,
    private nav: NavController
  ) {

    this.socket.connectuser().subscribe((data: any) => {
      console.log(data)
      if (data.data) {
        let fila = [...this.dataSource.data]

        const idx = fila.findIndex((it) => it.acc._id == data.data.UserID)

        if (idx >= 0) {

          fila[idx].estado = 1;
          fila[idx].islock = 0;
          fila[idx].acc.isConnect = 1;


          fila = this.orderUser(fila)

          this.dataSource.data = fila;

          let audio = new Audio('/assets/connect.mp3');
          audio.play();
        }
      }
    })

    this.socket.disconnectuser().subscribe((data: any) => {

      if (data.data) {
        let fila = [...this.dataSource.data]

        const idx = fila.findIndex((it) => it.acc._id == data.data.UserID)

        if (idx >= 0) {
          if (data.data.desc == 1) {
            fila[idx].estado = 0.5;
            fila[idx].acc.isConnect = 0;
          } else if (data.data.desc == 0) {
            fila[idx].estado = 1;
            let audio = new Audio('/assets/connect.mp3');
            audio.play();
          } else {
            fila[idx].acc.isConnect = 0;
            fila[idx].estado = 0;
          }



          fila = this.orderUser(fila)

          this.dataSource.data = fila;
        }
      }
    })

  }


  orderUser(arr) {
    return arr.sort((a, b) => {
      if (a.acc.isConnect > b.acc.isConnect) {
        return -1;
      }
      if (a.acc.isConnect < b.acc.isConnect) {
        return 1;
      }
      return 0;
    })
  }

  ngOnInit() {
  }

  cancel() {
    this.filtroTexto = '';
    this.getUsers();
  }

  async ionViewWillEnter() {
    const login = await this.stg.getLogin();

    if (login) {

      // Al entrar (o al cambiar de clinica desde el perfil) se vuelve a la activa.
      this.zonaActiva = Number(login[0].WorkZone);
      this.filtroZona = this.zonaActiva;

      this.cargarFiltros();
      this.getUsers();

      this.puedeCentral = login[0].RoleID == 8;

      this.permisos.refrescar().then((p) => {
        this.superAdmin = p.SuperAdmin === true;
        this.puedeCentral = login[0].RoleID == 8 || this.superAdmin;
      });

    }
  }

  abrirSuperAdmin() {
    this.nav.navigateForward(['/superadmin']);
  }

  async getUsers() {
    const login = await this.stg.getLogin();

    if (login) {
      try {

        const consulta = ++this.consulta;
        this.buscando = true;

        // Zonas y perfiles no cambian con los filtros: se piden una vez por clinica
        // activa y no en cada busqueda.
        if (this.catalogosZona !== this.zonaActiva) {
          const zonesRs = await this.api.apiGet('workzones', login[0].token)
          this.zonesCatalogo = zonesRs && zonesRs.response ? zonesRs.response : [];

          const perfilesRs: any = await this.api.apiGet('perfiles?WorkZoneID=' + login[0].WorkZone, login[0].token)
          this.perfiles = perfilesRs && perfilesRs.status ? perfilesRs.response : [];

          this.catalogosZona = this.zonaActiva;
        }

        const zones = { response: this.zonesCatalogo };
        this.zones = zones.response;

        const params = 'controlUsuarios?WorkZoneID=' + (this.filtroZona || '')
          + '&RoleID=' + (this.filtroRol === '' || this.filtroRol === null ? '' : this.filtroRol)
          + '&q=' + encodeURIComponent(this.filtroTexto || '');

        const rs = await this.api.apiGet(params, login[0].token)

        // Si mientras tanto se lanzo otra busqueda, esta respuesta ya no sirve.
        if (consulta !== this.consulta) return;

        this.buscando = false;
        this.dataSource.data = [];

        if (rs && !rs.status) {
          this.toast.MsgError(rs.err);
          this.loadActivities = true;
          return;
        }

        if (rs) {
          let fila = [...this.dataSource.data];
     

          rs.response.forEach(element => {

            let nuevo = [];
            zones.response.forEach((item: any) => {


              nuevo.push({
                Name: item.Name,
                IDVT: item.IDVT,
                check: element.WorkZoneID.filter((it) => it === item.IDVT).length > 0 ? true : false
              })

            })

            let obj = {
              estado: element.isConnect,
              name: element.FirstName + ' ' + element.LastName,
              login: element.Login,
              clave: element.Password,
              islock: element.IsLocked,
              isdelete: element.isCantDelete,
              isassigment: element.isCantAssigment,
              coh: element.COH || 0,
              perfil: element.Perfil || null,
              dashboard: element.Dashboard || 0,
              dashboardpages: element.DashboardPages || [],
              central: element.isCentral,
              centraladmin: element.isCentralAdmin,
              programmer: element.isCantProgrammer,
              zones: nuevo,
              acc: element
            }
            fila.push(obj)
          });
          this.dataSource.data = fila;

          this.totalUsuarios = rs.total || fila.length;

          this.dataSource.paginator = this.paginator;

          this.loadActivities = true;

          this.cargarDescansos();

        }
      } catch (error) {
        this.buscando = false;
        this.loadActivities = true;
      }
    }
  }

  // Trae los descansos ya creados en la zona para saber a quien le faltan. El
  // endpoint cruza ConfigDescansos con la coleccion descansos, asi que solo devuelve
  // a los usuarios que ya tienen registro.
  async cargarDescansos() {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.descansosPorUsuario = {};
    this.descansosCargados = false;

    try {
      const rs = await this.api.apiGet('descansos?zone=' + login[0].WorkZone, login[0].token)

      if (!rs || !rs.status) return;

      (rs.response || []).forEach((it) => {
        if (it.data) this.descansosPorUsuario[it.data.User] = true;
      });

      this.descansosCargados = true;
    } catch (error) { }
  }

  tieneDescansos(ele): boolean {
    return ele && ele.acc ? !!this.descansosPorUsuario[ele.acc._id] : false;
  }

  // Le crea al usuario su registro de descansos con los valores de ConfigDescansos
  // de la zona, igual que se hace al crear un usuario nuevo en POST /users.
  // Al que ya lo tiene no se le toca: por eso el boton solo sale cuando le falta.
  async configurarDescansos(ele) {
    const nombreZona = await this.clinica.nombre();

    const alert = await this.alertCtrl.create({
      header: 'Configurar descansos',
      message: 'Se le asignaran a ' + ele.name + ' los descansos configurados para ' + nombreZona + '.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aceptar',
          handler: () => {
            this.guardarDescansos(ele);
          }
        }
      ]
    })

    await alert.present();
  }

  async guardarDescansos(ele) {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;

    try {
      const rs = await this.api.apiPost('descansos/user', {
        userID: ele.acc._id,
        WorkZoneID: login[0].WorkZone,
        token: login[0].token
      })

      this.loading = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudieron configurar los descansos');
        return;
      }

      this.descansosPorUsuario[ele.acc._id] = true;

      // El backend avisa si el usuario ya tenia registro y no creo nada.
      this.toast.MsgOK(rs.created === false
        ? 'Este usuario ya tenia descansos configurados'
        : 'Descansos configurados para ' + ele.name);
    } catch (error) {
      this.loading = false;
      this.toast.MsgError('No se pudieron configurar los descansos');
    }
  }

  changeClave(event, ele) {

    const idx = this.dataSource.data.findIndex((it) => it.acc._id == ele._id)

    if (idx >= 0) {
      this.dataSource.data[idx].acc.Password = event.detail.value;
    }

  }

  async saveClave(ele) {

    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('changeClave', {
          _id: ele.acc._id,
          token: login[0].token,
          password: ele.acc.Password
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          this.toast.MsgOK('Proceso ejecutado correctamente')

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }


  // La busqueda va al API (login, nombre, apellido o clinica). Se espera a que deje
  // de escribir para no consultar en cada tecla.
  filtrar(event: any) {
    this.filtroTexto = (event.target && event.target.value ? event.target.value : '').trim();

    clearTimeout(this.buscarTimer);
    this.buscarTimer = setTimeout(() => this.getUsers(), 400);
  }

  cambiarFiltro() {
    this.getUsers();
  }

  async cargarFiltros() {
    const login = await this.stg.getLogin();
    if (!login) return;

    const rs: any = await this.api.apiGet('controlUsuarios/filtros', login[0].token);

    if (rs && rs.status) {
      this.rolesFiltro = rs.response.roles || [];
      this.zonasFiltro = rs.response.zonas || [];
    }
  }

  nombreRol(id) {
    const rol = this.rolesFiltro.find((r) => r.IDVT == id);
    return rol ? rol.Name : 'Rol ' + id;
  }

  // Los descansos se revisan contra la clinica activa: el boton solo tiene sentido
  // para quien trabaja en ella (con el filtro en "todas" salen usuarios de otras).
  esDeZonaActiva(ele): boolean {
    return ele && ele.acc && Array.isArray(ele.acc.WorkZoneID)
      && ele.acc.WorkZoneID.some((z) => Number(z) === this.zonaActiva);
  }

  // Agrega o quita una zona de trabajo del usuario. Se guarda al momento y, si el
  // API falla, el chip vuelve a como estaba. No se deja sin zonas: al iniciar sesion
  // entra con la primera (WorkZoneID[0]).
  async toggleZonaUsuario(item, element) {
    const login = await this.stg.getLogin();
    if (!login) return;

    const actuales: any[] = Array.isArray(element.acc.WorkZoneID) ? element.acc.WorkZoneID : [];
    const nuevas = item.check
      ? actuales.filter((z) => z != item.IDVT)
      : [...actuales, item.IDVT];

    if (!nuevas.length) {
      this.toast.MsgError('El usuario debe quedar con al menos una zona de trabajo');
      return;
    }

    item.guardando = true;

    try {
      const rs = await this.api.apiPost('changeZones', {
        _id: element.acc._id,
        token: login[0].token,
        zones: nuevas
      })

      item.guardando = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo actualizar la zona');
        return;
      }

      element.acc.WorkZoneID = nuevas;
      item.check = !item.check;
    } catch (error) {
      item.guardando = false;
      this.toast.MsgError('No se pudo actualizar la zona');
    }
  }

  async changeLock(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('islock', {
          _id: data.acc._id,
          token: login[0].token,
          lock: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

  async changeDelete(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isdelete', {
          _id: data.acc._id,
          token: login[0].token,
          delete: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            //   this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

  async changeAssigment(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isassigment', {
          _id: data.acc._id,
          token: login[0].token,
          assigment: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            //this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

  async assignPerfil(event, data) {
    const login = await this.stg.getLogin();
    if (!login) return;

    this.loading = true;

    try {
      const rs: any = await this.api.apiPost('assignPerfil', {
        _id: data.acc._id,
        token: login[0].token,
        Perfil: event.detail.value || null
      });

      this.loading = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'Error al asignar perfil');
        return;
      }

      data.acc.Perfil = event.detail.value || null;
      data.perfil = event.detail.value || null;
      this.toast.MsgOK('Perfil actualizado');
    } catch (error) {
      this.loading = false;
    }
  }

  // Acceso al modulo de Indicadores. Al quitarlo el backend le borra tambien las
  // paginas, asi que aca se refleja lo mismo para no dejar checks colgados.
  async changeDashboard(event, data) {
    const permitido = event.detail.checked ? 1 : 0;

    if (data.dashboard == permitido) return;

    const rs = await this.guardarPermisosDashboard(data, { Dashboard: permitido });
    if (!rs) return;

    data.dashboard = permitido;
    data.acc.Dashboard = permitido;

    if (!permitido) {
      data.dashboardpages = [];
      data.acc.DashboardPages = [];
    }

    this.toast.MsgOK(permitido ? 'Acceso al dashboard habilitado' : 'Acceso al dashboard retirado');
  }

  // Paginas del dashboard que puede ver. Asignarle al menos una le da tambien el
  // acceso al modulo: quedarian guardadas pero sin poder entrar, que no es lo que
  // se quiso hacer al marcarlas.
  async changeDashboardPages(event, data) {
    const paginas = event.detail.value || [];

    const cambios: any = { DashboardPages: paginas };
    const daAcceso = paginas.length > 0 && data.dashboard != 1;

    if (daAcceso) cambios.Dashboard = 1;

    const rs = await this.guardarPermisosDashboard(data, cambios);
    if (!rs) return;

    data.dashboardpages = paginas;
    data.acc.DashboardPages = paginas;

    if (daAcceso) {
      data.dashboard = 1;
      data.acc.Dashboard = 1;
    }

    this.toast.MsgOK(paginas.length
      ? 'Páginas del dashboard actualizadas'
      : 'Sin páginas asignadas: no verá ninguna pantalla');
  }

  private async guardarPermisosDashboard(data, cambios: any) {
    const login = await this.stg.getLogin();
    if (!login) return false;

    this.loading = true;

    try {
      const rs = await this.api.apiPost('dashboardPermisos', {
        _id: data.acc._id,
        token: login[0].token,
        ...cambios
      })

      this.loading = false;

      if (!rs || !rs.status) {
        this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudieron guardar los permisos del dashboard');
        return false;
      }

      // Si se los cambio a si mismo, relee los suyos: el menu y el guard leen el
      // login guardado y quedarian con los permisos viejos hasta recargar la pagina.
      if (login[0]._id == data.acc._id) await this.permisos.refrescar(true);

      return true;
    } catch (error) {
      this.loading = false;
      this.toast.MsgError('No se pudieron guardar los permisos del dashboard');
      return false;
    }
  }

  async changeCOH(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isCOH', {
          _id: data.acc._id,
          token: login[0].token,
          COH: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

  async changeC(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isCentral', {
          _id: data.acc._id,
          token: login[0].token,
          central: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            // Rechazado por el API (sin permiso, camillero...): el check vuelve a como estaba
            event.target.checked = !event.detail.checked;
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            //this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }


  async changeCA(event, data) {
    const login = await this.stg.getLogin();

    this.loading = true;

    if (login) {

      try {
        let rs = await this.api.apiPost('isCentralAdmin', {
          _id: data.acc._id,
          token: login[0].token,
          centraladmin: event.detail.checked ? 1 : 0
        })

        if (rs) {

          if (!rs.status) {
            // Rechazado por el API (sin permiso, camillero...): el check vuelve a como estaba
            event.target.checked = !event.detail.checked;
            this.toast.MsgError(rs.err)
            this.loading = false;
            return;
          }

          if (event.detail.checked) {
            //this.socket.lockEmit({ '_id': data.acc._id })
          }

          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
      }


    }

  }

}
