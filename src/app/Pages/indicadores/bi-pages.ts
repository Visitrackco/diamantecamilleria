// Páginas del dashboard de Indicadores.
//
// Una sola lista para los dos lados: el menú lateral del dashboard
// (indicadores.page.ts) y los permisos por pantalla que se asignan en Control de
// Usuarios (usuarios.page.ts). La clave viaja al backend en Users.DashboardPages y
// tiene que coincidir con la de `config/dashboardPages.js` del API.
export interface BiPage {
  key: string;
  label: string;
}

export const BI_PAGES: BiPage[] = [
  { key: 'camilleria', label: 'CAMILLERIA' },
  { key: 'camilleria2', label: 'CAMILLERIA 2' },
  { key: 'mapacalor', label: 'MAPA DE CALOR' },
  { key: 'mapacumplimiento', label: 'MAPA DE CUMPLIMIENTO' },
  // COMBINACION DE UBICACIONES muestra el cumplimiento por ubicacion (antes
  // "CAMILLERIA 4" y luego "AYUDAS DIAGNOSTICAS"). La clave de la pagina ('ayudas')
  // y la del componente en los links compartidos ('camilleria4') NO cambian: los
  // links ya compartidos dejarian de abrir.
  { key: 'ayudas', label: 'COMBINACION DE UBICACIONES' },
  { key: 'cantidad', label: 'CANTIDAD DE CAMILLEROS' },
  { key: 'nfc', label: 'USO DE NFC' },
];
