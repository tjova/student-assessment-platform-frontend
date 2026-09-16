const taskNameTranslations: Record<string, string> = {
  'submit paper': 'Predaj rad',
  'resubmit paper': 'Ponovo predaj rad',
  'grade paper': 'Oceni rad'
};

export function translateTaskName(name: string | null | undefined): string {
  if (!name) {
    return '—';
  }

  const normalizedName = name.trim().toLowerCase();
  return taskNameTranslations[normalizedName] ?? name;
}
