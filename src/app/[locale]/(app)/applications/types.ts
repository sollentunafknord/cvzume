export interface Job {
  id: string;
  headline: string;
  employer?: { name?: string };
  workplace_address?: { municipality?: string; region?: string };
  description?: { text?: string };
  application_deadline?: string;
  webpage_url?: string;
}

export function formatDeadline(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return null; }
}
