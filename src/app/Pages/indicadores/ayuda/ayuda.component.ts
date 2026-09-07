import { Component, Input } from '@angular/core';

// Un paso del cálculo del indicador
interface Paso { titulo: string; desc: string; }

// Un filtro de la pantalla y qué hace realmente contra los datos
interface Filtro { nombre: string; campo: string; desc: string; }

// Ficha de ayuda de una pantalla del dashboard
interface Ficha {
  titulo: string;
  resumen: string;
  // Fracción a mostrar cuando el indicador es un porcentaje
  formula?: { num: string; den: string; res: string };
  // Expresión simple cuando el indicador es un conteo
  metrica?: { expr: string; desc: string };
  // Hito/tramo de la línea de tiempo que se resalta en el diagrama
  resalta: 'respuesta' | 'asignacion' | 'solicitud' | 'marcajes';
  pasos: Paso[];
  filtros: Filtro[];
  notas: string[];
}

// Ayuda gráfica de cada pantalla del dashboard: qué mide el indicador, cómo se calcula
// paso a paso, qué hace cada filtro y con qué hay que tener cuidado al leerlo.
// Reemplaza el alert de texto que había antes.
@Component({
  selector: 'app-bi-ayuda',
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.scss'],
})
export class AyudaComponent {

  // Clave de la pantalla: camilleria | camilleria2 | mapacalor | mapacumplimiento |
  //                       ayudas | nfc | cantidad
  @Input() pagina = 'camilleria';

  abierto = false;

  // Filtros que comparten todas las pantallas (se reusan en las fichas)
  private static readonly F_FECHA: Filtro = {
    nombre: 'FECHA',
    campo: 'dateVisible',
    desc: 'Rango de días sobre la fecha de la solicitud. Se toma el día completo en hora de Bogotá.'
  };
  private static readonly F_PRIORIDAD: Filtro = {
    nombre: 'PRIORIDAD',
    campo: 'Motivo.Critico',
    desc: 'Crítico o no crítico. No es un campo de la solicitud: filtra por la marca del motivo.'
  };
  private static readonly F_UNIDAD: Filtro = {
    nombre: 'UNIDAD DEFINITIVA',
    campo: 'Destino.Grupo',
    desc: 'Adultos, Infantil, Alta complejidad o Medicina privada. Se decide por el grupo de la ubicación de DESTINO, no del origen.'
  };
  private static readonly F_MOTIVO: Filtro = {
    nombre: 'MOTIVO',
    campo: 'Motivo',
    desc: 'Un motivo puntual. Si además hay prioridad seleccionada, el motivo tiene que pertenecer a esa prioridad.'
  };
  private static readonly F_TIPO: Filtro = {
    nombre: 'TIPO',
    campo: 'isAdmin',
    desc: 'Camillería (isAdmin = 0), Administrativas (isAdmin = 1) o todas. Por defecto camillería.'
  };

  private static readonly N_DESNORM =
    'Los datos salen de la colección desnormalizada: lo que aún no haya pasado por ese proceso no aparece.';
  private static readonly N_ELIMINADAS =
    'Entran todos los estados menos las ELIMINADAS, así que hay solicitudes abiertas dentro del conteo.';
  private static readonly N_SIN_ORIGEN =
    'Una solicitud sin llegada a origen no se puede medir: cuenta en la cantidad, pero no entra en el porcentaje.';
  private static readonly N_ANS_CERO =
    'Los motivos con ANS en 0 no se miden, porque no hay tiempo contra el cual comparar.';

  private get fichas(): { [k: string]: Ficha } {
    const A = AyudaComponent;
    return {

      camilleria: {
        titulo: 'CAMILLERÍA',
        resumen: 'Qué porcentaje de las solicitudes se atendió dentro del tiempo prometido (el ANS del motivo).',
        formula: { num: 'Solicitudes a tiempo', den: 'Solicitudes medibles', res: '% cumplimiento' },
        resalta: 'respuesta',
        pasos: [
          {
            titulo: 'Se toman las solicitudes del rango',
            desc: 'Las de la zona, en el rango de fechas y con los filtros aplicados.'
          },
          {
            titulo: 'Se mide el tiempo de respuesta',
            desc: 'Minutos entre la fecha de la solicitud y la llegada del camillero al origen.'
          },
          {
            titulo: 'Se compara contra el ANS del motivo',
            desc: 'Si la respuesta es menor o igual al ANS cuenta como a tiempo; si se pasa, cuenta como fuera de tiempo.'
          },
          {
            titulo: 'Se saca el porcentaje',
            desc: 'A tiempo sobre el total de medibles. La meta (90% por defecto) viene de la configuración de la zona.'
          }
        ],
        filtros: [A.F_FECHA, A.F_PRIORIDAD, A.F_UNIDAD, A.F_TIPO],
        notas: [A.N_SIN_ORIGEN, A.N_ANS_CERO, A.N_ELIMINADAS, A.N_DESNORM]
      },

      camilleria2: {
        titulo: 'CAMILLERÍA 2 · TURNOS',
        resumen: 'El mismo cumplimiento, pero partido en turno día y turno noche, más el tiempo que se demora en asignarse una solicitud.',
        formula: { num: 'A tiempo del turno', den: 'Medibles del turno', res: '% del turno' },
        resalta: 'asignacion',
        pasos: [
          {
            titulo: 'Cada solicitud se clasifica en un turno',
            desc: 'Por la hora de la solicitud, contra el horario de turno día configurado en la zona (6:00 a 18:00 por defecto). Lo que queda por fuera es noche.'
          },
          {
            titulo: 'Se calcula el cumplimiento de cada turno',
            desc: 'Igual que en la pantalla de camillería: respuesta contra ANS, dentro de cada turno por separado.'
          },
          {
            titulo: 'Se promedia el tiempo de asignación',
            desc: 'Segundos entre la solicitud y el momento en que se le asignó un camillero. Es lo que tarda la central en despachar, no lo que tarda el traslado.'
          }
        ],
        filtros: [
          A.F_FECHA,
          { nombre: 'TURNO', campo: 'hora de la solicitud', desc: 'Deja solo día o solo noche. Con "todos" se muestran los dos bloques.' },
          A.F_PRIORIDAD, A.F_UNIDAD, A.F_MOTIVO, A.F_TIPO
        ],
        notas: [
          'El turno se decide por la hora de la SOLICITUD, no por la hora en que se asignó ni por el turno del camillero.',
          A.N_SIN_ORIGEN, A.N_DESNORM
        ]
      },

      mapacalor: {
        titulo: 'MAPA DE CALOR · CANTIDAD DE SERVICIOS',
        resumen: 'Cuántas solicitudes se pidieron en cada hora de cada día, para ver a qué horas se concentra la demanda.',
        metrica: { expr: 'celda = cantidad de solicitudes de esa hora en ese día', desc: 'Es un conteo simple de solicitudes.' },
        resalta: 'solicitud',
        pasos: [
          {
            titulo: 'Se agrupa por día y hora de la solicitud',
            desc: 'Las filas son las 24 horas y las columnas los días del rango.'
          },
          {
            titulo: 'Se cuenta cuántas solicitudes cayeron en cada celda',
            desc: 'La celda vacía significa que a esa hora no hubo solicitudes.'
          },
          {
            titulo: 'El color se escala contra la celda más alta',
            desc: 'La celda con más solicitudes queda al 100% de intensidad y el resto en proporción, por eso el color es relativo al rango que estés viendo.'
          }
        ],
        filtros: [A.F_FECHA, A.F_PRIORIDAD, A.F_UNIDAD, A.F_MOTIVO, A.F_TIPO],
        notas: [
          'Acá el Total de la columna sí es la suma de las horas, porque son servicios. En CANTIDAD DE CAMILLEROS no lo es.',
          'Cambiar el rango cambia los colores aunque los números sean los mismos: la escala se recalcula.',
          A.N_ELIMINADAS, A.N_DESNORM
        ]
      },

      mapacumplimiento: {
        titulo: 'MAPA DE CUMPLIMIENTO',
        resumen: 'El porcentaje de cumplimiento hora por hora, para encontrar las franjas donde se incumple el ANS.',
        formula: { num: 'A tiempo de la celda', den: 'Medibles de la celda', res: '% de la celda' },
        resalta: 'respuesta',
        pasos: [
          {
            titulo: 'Se agrupa por día y hora de la solicitud',
            desc: 'Misma rejilla del mapa de calor: 24 horas por los días del rango.'
          },
          {
            titulo: 'En cada celda se cuenta a tiempo y fuera de tiempo',
            desc: 'Con la misma regla de siempre: respuesta contra el ANS del motivo.'
          },
          {
            titulo: 'La celda muestra el porcentaje, no la cantidad',
            desc: 'El Total de la columna es el cumplimiento del día completo, no el promedio de las celdas.'
          }
        ],
        filtros: [A.F_FECHA, A.F_PRIORIDAD, A.F_UNIDAD, A.F_MOTIVO, A.F_TIPO],
        notas: [
          'Una celda con 100% puede tener una sola solicitud medida. Conviene leerla junto al mapa de calor para saber el volumen.',
          'Las celdas sin solicitudes medibles quedan vacías, que no es lo mismo que 0%.',
          A.N_SIN_ORIGEN, A.N_DESNORM
        ]
      },

      ayudas: {
        titulo: 'COMBINACIÓN DE UBICACIONES · CUMPLIMIENTO POR UBICACIÓN',
        resumen: 'Dónde se está incumpliendo: el mismo cumplimiento pero abierto por ubicación, en dos tablas, una por origen y otra por destino.',
        formula: { num: 'A tiempo de la ubicación', den: 'Medibles de la ubicación', res: '% de la ubicación' },
        resalta: 'respuesta',
        pasos: [
          {
            titulo: 'Se agrupan las solicitudes por ubicación',
            desc: 'Dos cortes independientes: uno por la ubicación de origen y otro por la de destino. La misma solicitud aparece en las dos tablas.'
          },
          {
            titulo: 'En cada ubicación se cuenta a tiempo y fuera de tiempo',
            desc: 'Con la regla del ANS del motivo, igual que las demás pantallas de cumplimiento.'
          },
          {
            titulo: 'Solo se listan las ubicaciones con algo que medir',
            desc: 'Si una ubicación no tiene ni una solicitud medible, no sale en la tabla.'
          }
        ],
        filtros: [
          A.F_FECHA,
          { nombre: 'ORÍGENES', campo: 'Origen', desc: 'Selección múltiple de ubicaciones de origen.' },
          { nombre: 'DESTINOS', campo: 'Destino', desc: 'Selección múltiple de ubicaciones. Si ya hay unidad definitiva seleccionada, se cruzan las dos condiciones.' },
          A.F_UNIDAD, A.F_MOTIVO, A.F_TIPO
        ],
        notas: [
          'Las dos tablas no suman entre ellas: son la misma solicitud vista por su origen y por su destino.',
          A.N_SIN_ORIGEN, A.N_DESNORM
        ]
      },

      nfc: {
        titulo: 'USO DE NFC',
        resumen: 'Con qué tecnología se marcó la apertura y el cierre de cada solicitud, para ver cuánto se está usando el NFC frente a los demás medios.',
        formula: { num: 'Marcajes con esa tecnología', den: 'Total de solicitudes del filtro', res: '% de uso' },
        resalta: 'marcajes',
        pasos: [
          {
            titulo: 'Se lee la tecnología de cada marcaje',
            desc: 'Dos tablas separadas: la del marcaje de origen (apertura) y la del marcaje de destino (cierre).'
          },
          {
            titulo: 'Lo que no trae tecnología se agrupa aparte',
            desc: 'Cuando se marca desde los botones del tablero web el campo llega vacío, y esas solicitudes caen en SIN TECNOLOGÍA.'
          },
          {
            titulo: 'Se saca el porcentaje sobre el total del filtro',
            desc: 'Cada fila es qué tajada del total representa esa tecnología.'
          }
        ],
        filtros: [A.F_FECHA, A.F_PRIORIDAD, A.F_UNIDAD, A.F_MOTIVO, A.F_TIPO],
        notas: [
          'SIN TECNOLOGÍA no es un error: son los marcajes hechos desde la web en lugar del móvil.',
          'Una solicitud sin marcar todavía también cae en SIN TECNOLOGÍA, así que en rangos con solicitudes abiertas esa fila se infla.',
          A.N_DESNORM
        ]
      },

      cantidad: {
        titulo: 'CANTIDAD DE CAMILLEROS',
        resumen: 'Cuántos camilleros distintos estuvieron recibiendo trabajo en cada hora, para comparar la operación real contra la demanda del mapa de calor.',
        metrica: {
          expr: 'celda = camilleros distintos (por id) con al menos una asignación en esa hora',
          desc: 'Es un conteo de personas, no de solicitudes: un camillero con ocho traslados en la hora suma uno.'
        },
        resalta: 'asignacion',
        pasos: [
          {
            titulo: 'Se toman las solicitudes que tuvieron camillero',
            desc: 'Las que nunca se asignaron no entran, porque no hay camillero que contar.'
          },
          {
            titulo: 'Cada asignación se ubica en su hora',
            desc: 'Por la fecha y hora en que se asignó el camillero, no por la fecha de la solicitud.'
          },
          {
            titulo: 'Se cuentan camilleros sin repetir',
            desc: 'En cada celda se junta el id de los camilleros y se cuenta el conjunto, así nadie se cuenta dos veces.'
          },
          {
            titulo: 'El total del día se vuelve a contar desde cero',
            desc: 'No se suman las horas: se juntan otra vez los ids de todo el día y se cuenta el conjunto.'
          }
        ],
        filtros: [
          { nombre: 'FECHA', campo: 'AssignedOn', desc: 'Rango sobre la fecha de ASIGNACIÓN, no sobre la de la solicitud, para que las columnas coincidan con lo que ves.' },
          { nombre: 'HORA', campo: 'hora de la asignación', desc: 'Selección múltiple. Recorta las filas y recalcula los totales por día solo con esas horas.' },
          A.F_PRIORIDAD, A.F_UNIDAD, A.F_MOTIVO, A.F_TIPO
        ],
        notas: [
          'El Total de la columna NO es la suma de las horas: son personas, y la misma persona trabaja varias horas.',
          'El KPI de solicitudes asignadas sí cuenta solicitudes, no camilleros. Es el único número de la pantalla que se puede sumar.',
          'Un camillero conectado pero sin asignaciones en la hora no aparece: se cuenta trabajo asignado, no presencia.',
          A.N_DESNORM
        ]
      }

    };
  }

  get doc(): Ficha {
    const f = this.fichas;
    return f[this.pagina] || f['camilleria'];
  }

  // ¿Este tramo/hito de la línea de tiempo es el que mide la pantalla?
  resalta(clave: string): boolean {
    return this.doc.resalta === clave;
  }

  // Hitos encendidos en el diagrama según lo que mida la pantalla
  private en(claves: string[]): boolean {
    return claves.indexOf(this.doc.resalta) >= 0;
  }
  get onSolicitud(): boolean { return this.en(['respuesta', 'asignacion', 'solicitud']); }
  get onAsignado(): boolean { return this.en(['asignacion']); }
  get onOrigen(): boolean { return this.en(['respuesta', 'marcajes']); }
  get onDestino(): boolean { return this.en(['marcajes']); }

  abrir() { this.abierto = true; }
  cerrar() { this.abierto = false; }
}
