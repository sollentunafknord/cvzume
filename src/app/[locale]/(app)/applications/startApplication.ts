// Platsbanken ilanından "Ny ansökan" akışını başlat (JobCard ve favoriler kullanır)
import type { Job } from './types';

export function startApplication(job: Job, locale: string) {
  const text = (job.description?.text || '').replace(/<[^>]+>/g, '');
  const head = [job.headline, [job.employer?.name, job.workplace_address?.municipality].filter(Boolean).join(' · ')].filter(Boolean).join('\n');
  localStorage.setItem('cvita_prefill_job', JSON.stringify({
    role: [job.headline, job.employer?.name].filter(Boolean).join(' — '),
    description: `${head}\n\n${text}`.slice(0, 8000),
  }));
  window.location.assign(`/${locale}/ny`);
}
