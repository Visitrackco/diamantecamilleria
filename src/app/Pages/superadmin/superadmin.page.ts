import { Component } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { ApiService } from 'src/app/Services/api.service';
import { StorageWebService } from 'src/app/Services/storage.service';
import { ToastService } from 'src/app/Services/toast.service';
import { BI_PAGES } from 'src/app/Pages/indicadores/bi-pages';

// Rol con reglas propias en el resto de la app (Control de Usuarios, verifyToken).
// Tiene que coincidir con ROL_CAMILLERO de routes/Users/superAdmin.js.
const ROL_CAMILLERO = 35;

interface FuncionRol {
  key: string;
  label: string;
  descripcion: string;
}

// Modulo Super Admin: crear usuarios con todos sus permisos, administrar los roles
// (crear, renombrar, prender/apagar cada funcion, eliminar) y las zonas de trabajo
// (crear, editar, eliminar las que no tienen nada asociado). Solo entra quien tenga
// Users.SuperAdmin (SuperAdminGuard) y el API lo vuelve a validar en cada endpoint.
@Component({
  selector: 'app-superadmin',
  templateUrl: './superadmin.page.html',
  styleUrls: ['./superadmin.page.scss'],
})
export class SuperAdminPage {

  tab: 'usuario' | 'roles' | 'zonas' = 'usuario';

  cargando = false;
  guardando = false;

  roles: any[] = [];
  zonas: any[] = [];
  perfiles: any[] = [];
  funciones: FuncionRol[] = [];
  biPages = BI_PAGES;

  usuario: any = this.usuarioVacio();

  // Resultado de la validacion en vivo de los valores unicos: null = sin revisar.
  disponible: any = { Login: null, Email: null, IDVT: null };

  nuevoRol: any = this.rolVacio();
  rolesTabla: any[] = [];

  nuevaZona: any = this.zonaVacia();
  zonasTabla: any[] = [];

  constructor(
    private api: ApiService,
    private stg: StorageWebService,
    private toast: ToastService,
    private alertCtrl: AlertController,
    private nav: NavController
  ) { }

  async ionViewWillEnter() {
    await this.cargar();
  }

  private usuarioVacio() {
    return {
      FirstName: '',
      LastName: '',
      Login: '',
      Password: '',
      Email: '',
      IDVT: '',
      RoleID: null,
      WorkZoneID: [],
      Perfil: null,
      isCantDelete: false,
      isCantAssigment: false,
      COH: false,
      isCentral: false,
      isCentralAdmin: false,
      DashboardPages: [],
      IsLocked: false,
      SuperAdmin: false
    };
  }

  private rolVacio() {
    return { Name: '', IDVT: '', Web: true, Mobile: false, Historial: false, Reportes: false, Listas: false, Sesiones: false };
  }

  private zonaVacia() {
    return { Name: '', IDVT: '', Code: '', TagUID: '', LoginModo: 'NFC', LogoutModo: 'NFC' };
  }

  // Como inicia y cierra sesion el camillero en la app movil, por zona.
  modosLogin = [
    { value: 'NFC', label: 'Tarjeta NFC' },
    { value: 'QR', label: 'Código QR' },
    { value: 'AMBOS', label: 'NFC o QR' },
    // NA: no pide NFC ni QR al entrar, al salir ni dentro de la app (origen, destino y
    // retornos se marcan con un botón). Para la zona de pruebas / revisión de Google Play.
    { value: 'NINGUNO', label: 'NA (sin lectura)' }
  ];

  private async token() {
    const login = await this.stg.getLogin();
    return login && login.length ? login[0].token : null;
  }

  async cargar() {
    const token = await this.token();
    if (!token) return;

    this.cargando = true;

    const [cat, roles, zonas]: any[] = await Promise.all([
      this.api.apiGet('superadmin/catalogos', token),
      this.api.apiGet('superadmin/roles', token),
      this.api.apiGet('superadmin/zonas', token)
    ]);

    this.cargando = false;

    if (!cat || !cat.status) {
      this.toast.MsgError(cat && cat.err ? cat.err : 'No se pudieron cargar los catálogos');
      return;
    }

    this.roles = cat.response.roles || [];
    this.zonas = cat.response.zonas || [];
    this.perfiles = cat.response.perfiles || [];
    this.funciones = cat.response.funciones || [];

    if (roles && roles.status) this.rolesTabla = roles.response;
    if (zonas && zonas.status) this.zonasTabla = zonas.response;
  }

  // ===================== USUARIO =====================

  get rolSeleccionado() {
    return this.roles.find((r) => r.IDVT == this.usuario.RoleID);
  }

  get esCamillero() {
    return this.usuario.RoleID == ROL_CAMILLERO;
  }

  // Los perfiles de solicitud son por zona: solo se ofrecen los de las zonas marcadas.
  get perfilesZona() {
    return this.perfiles.filter((p) => this.usuario.WorkZoneID.indexOf(Number(p.WorkZoneID)) >= 0);
  }

  nombreZona(id) {
    const z = this.zonas.find((it) => it.IDVT == id);
    return z ? z.Name : id;
  }

  funcionesActivas(rol) {
    return rol ? this.funciones.filter((f) => rol[f.key] == 1) : [];
  }

  tieneZona(id) {
    return this.usuario.WorkZoneID.indexOf(id) >= 0;
  }

  // La primera zona marcada es con la que entra al iniciar sesion (WorkZoneID[0]).
  toggleZona(id) {
    const idx = this.usuario.WorkZoneID.indexOf(id);

    if (idx >= 0) this.usuario.WorkZoneID.splice(idx, 1);
    else this.usuario.WorkZoneID.push(id);

    if (this.usuario.Perfil && !this.perfilesZona.some((p) => p._id == this.usuario.Perfil)) {
      this.usuario.Perfil = null;
    }
  }

  tienePagina(key) {
    return this.usuario.DashboardPages.indexOf(key) >= 0;
  }

  togglePagina(key) {
    const idx = this.usuario.DashboardPages.indexOf(key);
    if (idx >= 0) this.usuario.DashboardPages.splice(idx, 1);
    else this.usuario.DashboardPages.push(key);
  }

  async revisar(campo: 'Login' | 'Email' | 'IDVT') {
    const valor = String(this.usuario[campo] || '').trim();

    if (!valor) {
      this.disponible[campo] = null;
      return;
    }

    const token = await this.token();
    const rs: any = await this.api.apiGet('superadmin/disponible?campo=' + campo + '&valor=' + encodeURIComponent(valor), token);

    this.disponible[campo] = rs && rs.status ? rs.response : null;
  }

  // Lo mismo que valida el API, para avisar antes de mandar. El API manda la ultima palabra.
  get erroresUsuario(): string[] {
    const u = this.usuario;
    const err = [];

    if (!u.FirstName.trim()) err.push('Nombre');
    if (!u.LastName.trim()) err.push('Apellido');
    if (!u.Login.trim()) err.push('Login');
    if (String(u.Password).trim().length < 4) err.push('Clave (mínimo 4 caracteres)');
    if (u.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.Email.trim())) err.push('Email válido');
    if (!u.RoleID) err.push('Rol');
    if (!u.WorkZoneID.length) err.push('Al menos una zona');
    if (this.disponible.Login === false) err.push('Login sin repetir');
    if (this.disponible.Email === false) err.push('Email sin repetir');
    if (this.disponible.IDVT === false) err.push('ID Visitrack sin repetir');

    return err;
  }

  async crearUsuario() {
    if (this.erroresUsuario.length) {
      this.toast.MsgError('Falta: ' + this.erroresUsuario.join(', '));
      return;
    }

    const token = await this.token();
    if (!token) return;

    const u = this.usuario;

    this.guardando = true;

    const rs: any = await this.api.apiPost('superadmin/users', {
      token,
      FirstName: u.FirstName,
      LastName: u.LastName,
      Login: u.Login,
      Password: u.Password,
      Email: u.Email,
      IDVT: u.IDVT,
      RoleID: u.RoleID,
      WorkZoneID: u.WorkZoneID,
      Perfil: u.Perfil,
      isCantDelete: u.isCantDelete ? 1 : 0,
      isCantAssigment: u.isCantAssigment ? 1 : 0,
      COH: u.COH ? 1 : 0,
      isCentral: u.isCentral ? 1 : 0,
      isCentralAdmin: u.isCentralAdmin ? 1 : 0,
      Dashboard: u.DashboardPages.length ? 1 : 0,
      DashboardPages: u.DashboardPages,
      IsLocked: u.IsLocked ? 1 : 0,
      SuperAdmin: u.SuperAdmin === true
    });

    this.guardando = false;

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo crear el usuario');
      return;
    }

    this.toast.MsgOK('Usuario ' + rs.response.Login + ' creado'
      + (rs.descansos ? '' : '. La zona no tiene descansos configurados: asígnelos desde Control de Usuarios'));

    this.limpiarUsuario();
  }

  limpiarUsuario() {
    this.usuario = this.usuarioVacio();
    this.disponible = { Login: null, Email: null, IDVT: null };
  }

  // ===================== ROLES =====================

  async crearRol() {
    if (!this.nuevoRol.Name.trim()) {
      this.toast.MsgError('El nombre del rol es obligatorio');
      return;
    }

    const token = await this.token();
    if (!token) return;

    const body: any = { token, Name: this.nuevoRol.Name, IDVT: this.nuevoRol.IDVT };
    this.funciones.forEach((f) => { body[f.key] = this.nuevoRol[f.key] ? 1 : 0; });

    this.guardando = true;
    const rs: any = await this.api.apiPost('superadmin/roles', body);
    this.guardando = false;

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo crear el rol');
      return;
    }

    this.toast.MsgOK('Rol ' + rs.response.Name + ' creado con ID ' + rs.response.IDVT);
    this.nuevoRol = this.rolVacio();
    await this.cargar();
  }

  // Cada switch se guarda al momento. Si el API falla se devuelve el switch.
  async cambiarFuncion(rol, key: string, valor: boolean) {
    const token = await this.token();
    if (!token) return;

    const anterior = rol[key];
    rol[key] = valor ? 1 : 0;

    const rs: any = await this.api.apiPost('superadmin/roles/' + rol._id, { token, [key]: rol[key] });

    if (!rs || !rs.status) {
      rol[key] = anterior;
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo actualizar el rol');
      return;
    }

    this.sincronizarCatalogo(rs.response);
  }

  async renombrar(rol) {
    const alert = await this.alertCtrl.create({
      header: 'Renombrar rol',
      inputs: [{ name: 'Name', type: 'text', value: rol.Name, placeholder: 'Nombre del rol' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            this.guardarNombre(rol, data.Name);
          }
        }
      ]
    });

    await alert.present();
  }

  private async guardarNombre(rol, nombre: string) {
    if (!nombre || !nombre.trim() || nombre.trim() === rol.Name) return;

    const token = await this.token();
    const rs: any = await this.api.apiPost('superadmin/roles/' + rol._id, { token, Name: nombre });

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo renombrar el rol');
      return;
    }

    rol.Name = rs.response.Name;
    this.sincronizarCatalogo(rs.response);
    this.toast.MsgOK('Rol renombrado');
  }

  async eliminarRol(rol) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar rol',
      message: '¿Eliminar el rol ' + rol.Name + '? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminar(rol);
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmarEliminar(rol) {
    const token = await this.token();
    const rs: any = await this.api.apiDelete('superadmin/roles/' + rol._id, token);

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo eliminar el rol');
      return;
    }

    this.toast.MsgOK('Rol eliminado');
    await this.cargar();
  }

  // El select de rol del formulario de usuario usa la lista del catalogo: se le
  // aplican los cambios de la tabla para que muestre las funciones al dia.
  private sincronizarCatalogo(rol) {
    const idx = this.roles.findIndex((r) => r._id == rol._id);
    if (idx >= 0) this.roles[idx] = { ...this.roles[idx], ...rol };
  }

  // ===================== ZONAS =====================

  // Algo cuelga de la zona: el API no la deja eliminar.
  zonaEnUso(z) {
    return z.Operativa || z.Usuarios > 0 || z.Ubicaciones > 0 || z.Motivos > 0 || z.Perfiles > 0;
  }

  async crearZona() {
    if (!this.nuevaZona.Name.trim()) {
      this.toast.MsgError('El nombre de la zona es obligatorio');
      return;
    }

    const token = await this.token();
    if (!token) return;

    this.guardando = true;
    const rs: any = await this.api.apiPost('superadmin/zonas', { token, ...this.nuevaZona });
    this.guardando = false;

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo crear la zona');
      return;
    }

    this.toast.MsgOK('Zona ' + rs.response.Name + ' creada con ID ' + rs.response.IDVT);
    this.nuevaZona = this.zonaVacia();
    await this.cargar();
  }

  async editarZona(zona) {
    const alert = await this.alertCtrl.create({
      header: 'Editar zona ' + zona.IDVT,
      inputs: [
        { name: 'Name', type: 'text', value: zona.Name, placeholder: 'Nombre' },
        { name: 'Code', type: 'text', value: zona.Code, placeholder: 'Código' },
        { name: 'TagUID', type: 'text', value: zona.TagUID, placeholder: 'TagUID' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            this.guardarZona(zona, data);
          }
        }
      ]
    });

    await alert.present();
  }

  // Se guarda al cambiar el select de la tabla. campo: LoginModo (inicio) o LogoutModo (cierre).
  async cambiarModoLogin(zona, campo: 'LoginModo' | 'LogoutModo', modo) {
    const anterior = zona[campo];
    zona[campo] = modo;

    const token = await this.token();
    const rs: any = await this.api.apiPost('superadmin/zonas/' + zona._id, { token, [campo]: modo });

    if (!rs || !rs.status) {
      zona[campo] = anterior;
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo cambiar el modo');
      return;
    }

    const label = this.modosLogin.find((m) => m.value == modo).label;
    this.toast.MsgOK(zona.Name + ': los camilleros ' + (campo == 'LoginModo' ? 'entran' : 'cierran sesión') + ' con ' + label);
  }

  private async guardarZona(zona, data) {
    if (!data.Name || !data.Name.trim()) {
      this.toast.MsgError('El nombre de la zona es obligatorio');
      return;
    }

    const token = await this.token();
    const rs: any = await this.api.apiPost('superadmin/zonas/' + zona._id, {
      token,
      Name: data.Name,
      Code: data.Code,
      TagUID: data.TagUID
    });

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo actualizar la zona');
      return;
    }

    this.toast.MsgOK('Zona actualizada');
    await this.cargar();
  }

  async eliminarZona(zona) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar zona',
      message: '¿Eliminar la zona ' + zona.Name + '? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminarZona(zona);
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmarEliminarZona(zona) {
    const token = await this.token();
    const rs: any = await this.api.apiDelete('superadmin/zonas/' + zona._id, token);

    if (!rs || !rs.status) {
      this.toast.MsgError(rs && rs.err ? rs.err : 'No se pudo eliminar la zona');
      return;
    }

    this.toast.MsgOK('Zona eliminada');
    await this.cargar();
  }

  volver() {
    this.nav.navigateBack(['/control']);
  }

}
