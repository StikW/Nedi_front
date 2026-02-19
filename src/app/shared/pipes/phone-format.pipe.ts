import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat',
  standalone: true
})
export class PhoneFormatPipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    // Remover todos los caracteres no numéricos
    const cleanNumber = value.replace(/\D/g, '');
    
    // Si el número ya tiene código de país (empieza con +), devolverlo tal como está
    if (value.startsWith('+')) {
      return value;
    }

    // Detectar números con código de país ya incluido (sin el +)
    // Perú: 11 dígitos (51 + 9 dígitos) o 12 dígitos
    if ((cleanNumber.length === 11 || cleanNumber.length === 12) && cleanNumber.startsWith('51')) {
      return `+${cleanNumber}`;
    }

    // Colombia: 11 dígitos (57 + 10 dígitos) o 12 dígitos
    if ((cleanNumber.length === 11 || cleanNumber.length === 12) && cleanNumber.startsWith('57')) {
      return `+${cleanNumber}`;
    }

    // Chile: 11 dígitos (56 + 9 dígitos) o 12 dígitos
    if ((cleanNumber.length === 11 || cleanNumber.length === 12) && cleanNumber.startsWith('56')) {
      return `+${cleanNumber}`;
    }

    // Detectar números de Perú (+51)
    // Números de Perú tienen 9 dígitos (celular típicamente empieza con 9)
    if (cleanNumber.length === 9) {
      return `+51${cleanNumber}`;
    }

    // Detectar números de Colombia (+57)
    // Números de Colombia tienen 10 dígitos
    if (cleanNumber.length === 10) {
      return `+57${cleanNumber}`;
    }

    // Si ya tiene formato internacional (más de 12 dígitos), agregar el +
    if (cleanNumber.length > 12) {
      return `+${cleanNumber}`;
    }

    // Para números muy cortos, devolver tal como está
    return value;
  }
}
