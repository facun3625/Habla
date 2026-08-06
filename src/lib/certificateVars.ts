export const CERTIFICATE_VARIABLES = [
  { key: 'nombre', label: 'Nombre del alumno' },
  { key: 'profesion', label: 'Profesión' },
  { key: 'dni', label: 'DNI' },
  { key: 'curso', label: 'Nombre del curso' },
  { key: 'modulo', label: 'Nombre del módulo (vacío si es de curso completo)' },
  { key: 'fecha', label: 'Fecha de emisión' },
] as const;

export function fillCertificateTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

// Alumnas suelen cargar su nombre en minúsculas o en formatos mezclados — el certificado
// siempre debe mostrarlo con la primera letra de cada palabra en mayúscula.
export function toTitleCase(text: string): string {
  return text
    .toLocaleLowerCase('es-AR')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('es-AR') + word.slice(1))
    .join(' ');
}
