export function translateStatus(status: unknown): string {
  if (status == null || status === '') return '—';

  switch (String(status).toUpperCase()) {
    case 'ACTIVE':
      return 'AKTIVAN';
    case 'COMPLETED':
      return 'ZAVRŠEN';
    default:
      return String(status);
  }
}
