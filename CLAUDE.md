# CLAUDE.md

Este archivo proporciona orientacion a Claude Code (claude.ai/code) al trabajar con el codigo de este repositorio.

## Descripcion del Proyecto

Diamante Camilleria — aplicacion hibrida movil/web con Angular 16 + Ionic 7 para el seguimiento de actividades hospitalarias (gestion de camilleria). Interfaz en español. API backend en `diamanteticvisitrack.com` con comunicacion en tiempo real via Socket.io y notificaciones push con Firebase Cloud Messaging.

## Comandos de Desarrollo

- `npm start` — servidor de desarrollo (`ng serve`)
- `npm run build` — build de produccion (salida: `www/`)
- `npm run watch` — build de desarrollo con watch
- `npm test` — ejecutar tests Jasmine/Karma (Chrome)
- `npm run lint` — ESLint

## Arquitectura

**Enrutamiento:** Rutas con lazy loading en `app-routing.module.ts`, navegacion basada en hash (`useHash: true`) y estrategia `PreloadAllModules`. Cuatro guards de ruta: `LoginGuard`, `PageGuard`, `FormRNGGuard` (Rio Negro), `FormMEDGuard` (Medellin).

**Servicios (`src/app/Services/`):**
- `api.service.ts` — todas las llamadas REST al backend. Usa headers `x-token` y `x-web` para autenticacion.
- `storage.service.ts` — wrapper de Ionic Storage (IndexedDB → SecureStorage → LocalStorage). Persiste estado de login, zona de trabajo y tokens.
- `observer.service.ts` — BehaviorSubjects de RxJS para estado compartido entre componentes (logo, roleInfo, señales de reload).
- `Sockets.service.ts` — eventos en tiempo real con Socket.io. Se conecta a salas especificas del hospital segun WorkZone.
- `toast.service.ts` — notificaciones toast de Ionic.

**Componentes compartidos (`src/app/Components/`):** Exportados via `ComponentsModule`. Incluye menu, options, perfil, loading, history, detail, version-activities, descansos y custom-option. Tambien re-exporta modulos de Angular Material (Table, Paginator, Datepicker, FormField, Spinner).

**Paginas (`src/app/Pages/`):** 18 paginas de funcionalidades. Las principales: `dashboard` (tabla de actividades), `form`/`form-medellin`/`form-pruebas` (formularios de entrada por sede), `control` (gestion de usuarios), `session` (gestion de sesiones), `charts` (visualizacion), `Reportes/tabla` (reportes con exportacion xlsx).

**Flujo de autenticacion:** Google Sign-In OAuth → token de API → almacenado en Ionic Storage → los guards verifican el storage en cada navegacion. Notificaciones FCM configuradas en `app.component.ts`.

## Patrones Clave

- Formularios especificos por sede (Rio Negro, Medellin, Pruebas) con guards y modulos dedicados
- Salas de Socket.io nombradas por WorkZone + sufijos "central"/"centraladmin"
- Prefijo de selector de componentes: `app-` (kebab-case); prefijo de directivas: `app` (camelCase)
- SCSS para estilos; variables del tema en `src/theme/variables.scss`
- Proyecto Firebase: `diamante-de4da`
- Modo estricto de TypeScript esta DESACTIVADO
