import { FormGroup } from '@angular/forms';

export interface Faltante {
  campo: string;
  label: string;
}

// Campos obligatorios de los formularios de solicitud (Rionegro, Medellin, Pruebas,
// Reina Sofia). Se calcula sobre lo que esta en pantalla segun el motivo elegido:
// asi no bloquea un campo oculto (p.ej. los de insumos despues de cambiar de motivo)
// y cada formulario marca en rojo exactamente lo que se lista aca.
export function camposFaltantes(form: FormGroup, isPaciente: boolean, isInsumos: boolean, preguntas: any[]): Faltante[] {
  const faltan: Faltante[] = [];

  if (!form) return faltan;

  const valor = (campo) => form.controls[campo] ? form.controls[campo].value : null;
  const vacio = (campo) => {
    const v = valor(campo);
    return v === null || v === undefined || (typeof v === 'string' ? v.trim() === '' : v === '');
  };
  const pedir = (campo, label) => { if (vacio(campo)) faltan.push({ campo, label }); };

  pedir('fecha', 'Fecha de solicitud');
  pedir('hora', 'Hora de solicitud');
  pedir('solicita', 'Nombre de quien solicita');
  pedir('origen', 'Origen');
  pedir('destino', 'Destino');
  pedir('motivos', 'Motivo');

  if (isInsumos) {
    pedir('nominsumo', 'Nombre del insumo');
    pedir('nomsoli', 'Nombre del solicitante');
    pedir('cargosoli', 'Cargo del solicitante');
  }

  if (isPaciente || isInsumos) {
    pedir('nombrepac', 'Nombre del paciente');
  }

  if (isPaciente) {
    const id = String(valor('idpac') === null || valor('idpac') === undefined ? '' : valor('idpac')).trim();

    if (!id) faltan.push({ campo: 'idpac', label: 'Identificación del paciente' });
    else if (id.length < 4) faltan.push({ campo: 'idpac', label: 'Identificación del paciente (mínimo 4 caracteres)' });

    const recursos = valor('recurso');
    if (!Array.isArray(recursos) || recursos.length === 0) faltan.push({ campo: 'recurso', label: 'Recursos necesarios' });

    pedir('aislado', 'Si se encuentra aislado');
  }

  (preguntas || []).forEach((p) => pedir(p.Api.toString().toLowerCase(), p.Name));

  return faltan;
}
