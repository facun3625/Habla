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
