export function isInstallmentPlanSettled(installments: { status: string }[] | null | undefined): boolean {
  if (!installments || installments.length === 0) return true;
  return installments.every((i) => i.status === 'ACCEPTED');
}
