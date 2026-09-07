import { Component, HostListener, OnInit } from '@angular/core';
import { ClinicaService } from 'src/app/Services/clinica.service';
import { PermisosService } from 'src/app/Services/permisos.service';
import { DashboardFiltrosService } from './dashboard-filtros.service';
import { BiPage, BI_PAGES } from './bi-pages';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-indicadores',
  templateUrl: './indicadores.page.html',
  styleUrls: ['./indicadores.page.scss'],
})
export class IndicadoresPage implements OnInit {

  collapsed = false;

  // Menu de paginas abierto. Solo aplica en pantallas angostas, donde la barra
  // lateral se comporta como un cajon que entra desde la izquierda.
  menuAbierto = false;

  // Pagina marcada en el menu lateral.
  selectedPage = '';

  // Pagina que esta realmente montada en el lienzo. Se separa de selectedPage para
  // poder destruirla y volver a crearla (montarPagina) sin que el menu parpadee.
  paginaActiva = '';

  // Clinica activa: se muestra en los titulos para no confundir Medellin con Rionegro.
  clinica = '';

  // Zona con la que se pintaron los datos que estan en pantalla. Ionic mantiene la
  // pagina viva al salir, asi que hay que compararla al volver para no dejar datos
  // de la clinica anterior.
  private zonaPintada = 0;

  // Remontaje pendiente de la pagina activa (ver montarPagina).
  private montaje: any = null;

  // Páginas del dashboard (equivalente a las "Páginas" de Power BI) que este
  // usuario tiene habilitadas. Se arma en cada entrada desde sus permisos.
  pages: BiPage[] = [];

  // Entro al dashboard pero sin ninguna pantalla asignada: hay que decirlo, si no
  // queda un lienzo en blanco sin explicacion.
  sinPaginas = false;

  constructor(
    private clinicaSvc: ClinicaService,
    private permisos: PermisosService,
    private filtros: DashboardFiltrosService
  ) { }

  ngOnInit() { }

  // Ionic deja la pagina montada al salir, asi que sin esto al volver quedarian los
  // permisos y los datos de la entrada anterior hasta recargar el navegador.
  async ionViewWillEnter() {
    await this.cargarPaginas();
    await this.sincronizarZona();
    this.montarPagina();
  }

  // Solo las paginas que el usuario tiene asignadas en Control de Usuarios. Se
  // releen del API en cada entrada: si la central le acaba de habilitar una, tiene
  // que aparecer al entrar y no hasta que recargue la pagina.
  private async cargarPaginas() {
    const permisos = await this.permisos.refrescar();

    this.pages = BI_PAGES.filter((p) => permisos.DashboardPages.indexOf(p.key) >= 0);
    this.sinPaginas = this.pages.length === 0;

    // La pagina abierta puede haber quedado fuera de sus permisos (se los cambiaron
    // mientras estaba adentro): se cae a la primera que si tenga.
    if (!this.pages.some((p) => p.key === this.selectedPage)) {
      this.selectedPage = this.pages.length ? this.pages[0].key : '';
    }
  }

  private async sincronizarZona() {
    const zona = await this.clinicaSvc.zona();
    this.clinica = await this.clinicaSvc.nombre();

    if (this.zonaPintada && this.zonaPintada !== zona) {
      // Los filtros compartidos traen valores de la otra clinica (el motivo es un
      // _id de esa zona y la unidad puede no existir aca), asi que se sueltan.
      this.filtros.reset();
    }

    this.zonaPintada = zona;
  }

  // Destruye y vuelve a crear el componente de la pagina activa para que corra su
  // ngOnInit y lance la consulta al API. Se hace en cada entrada porque Ionic no
  // destruye la pantalla al salir: si no, al volver se quedarian los datos viejos
  // (o el lienzo sin cargar) hasta recargar el navegador.
  private montarPagina() {
    if (this.montaje) clearTimeout(this.montaje);

    const actual = this.selectedPage;
    this.paginaActiva = '';

    if (!actual) {
      this.montaje = null;
      return;
    }

    this.montaje = setTimeout(() => {
      this.montaje = null;
      this.paginaActiva = actual;
    });
  }

  // Fechas con las que se consulto la pantalla actual. Salen de los filtros
  // compartidos, que cada pantalla guarda al cargar; van en el titulo para no
  // perderlas de vista al bajar (y porque en el celular los filtros estan en el cajon).
  get rangoFechas(): string {
    const d = moment(this.filtros.desde);
    const h = moment(this.filtros.hasta);

    if (!d.isValid() || !h.isValid()) return '';

    return d.isSame(h, 'day')
      ? d.format('DD/MM/YYYY')
      : d.format('DD/MM/YYYY') + ' a ' + h.format('DD/MM/YYYY');
  }

  // La franja horaria solo se nombra cuando no es el dia completo.
  get rangoHoras(): string {
    const f = this.filtros.horaFrom;
    const t = this.filtros.horaTo;

    if (!f || !t || (f === '00:00' && t === '23:30')) return '';
    return f + ' a ' + t;
  }

  get currentLabel(): string {
    const p = this.pages.find((x) => x.key === this.selectedPage);
    return p ? p.label : '';
  }

  select(key: string) {
    // Si habia un remontaje en camino se cancela: la pagina que se acaba de elegir
    // manda, y si no volveria a aparecer la anterior.
    if (this.montaje) {
      clearTimeout(this.montaje);
      this.montaje = null;
    }

    this.selectedPage = key;
    this.paginaActiva = key;
    this.cerrarMenu();
  }

  abrirMenu() {
    this.menuAbierto = true;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  // Al ensanchar la ventana la barra vuelve a ser fija: se cierra el cajon para no
  // dejar el fondo oscuro encima del tablero.
  @HostListener('window:resize')
  onResize() {
    if (this.menuAbierto && window.innerWidth > 900) this.cerrarMenu();
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

}
