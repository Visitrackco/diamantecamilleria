import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[onlyNumbers]',
  standalone: true
})
export class OnlyNumbersDirective {

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'];

    // 1. Permitir teclas de navegación y borrado
    if (allowedKeys.indexOf(event.key) !== -1) {
      return;
    }

    // 2. PERMITIR combinaciones con Ctrl, Alt o Meta (Command en Mac)
    // Esto habilita Ctrl+V, Ctrl+C, Ctrl+A, etc.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // 3. Bloquear si no es un número (0-9)
    const isNumber = /[0-9]/.test(event.key);
    if (!isNumber) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text');

    // Validar que el contenido del portapapeles sea numérico
    if (pastedText && !/^[0-9]+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}