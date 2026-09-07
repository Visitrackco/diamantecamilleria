// Rampa de color compartida por los mapas de calor del dashboard (mapa de calor,
// mapa de cumplimiento y cantidad de camilleros), para que los tres se lean igual.
// Va de amarillo a naranja y termina en rojo (escala YlOrRd).
const RAMPA = [
  [255, 255, 178],   // amarillo claro  - intensidad baja
  [254, 204, 92],    // amarillo
  [253, 141, 60],    // naranja
  [240, 59, 32],     // rojo
  [189, 0, 38]       // rojo profundo   - intensidad maxima
];

// Interpola la rampa. `t` va de 0 (bajo) a 1 (alto).
export function colorHeat(t: number): string {
  const v = Math.max(0, Math.min(1, t || 0));

  const paso = v * (RAMPA.length - 1);
  const i = Math.min(RAMPA.length - 2, Math.floor(paso));
  const f = paso - i;

  const desde = RAMPA[i];
  const hasta = RAMPA[i + 1];
  const mezcla = (a: number, b: number) => Math.round(a + (b - a) * f);

  return 'rgb(' + mezcla(desde[0], hasta[0]) + ', '
    + mezcla(desde[1], hasta[1]) + ', '
    + mezcla(desde[2], hasta[2]) + ')';
}

// Color de texto que se sigue leyendo sobre el fondo que devuelve colorHeat.
export function colorTextoHeat(t: number): string {
  return (t || 0) > 0.55 ? '#fff' : '#5b1013';
}
