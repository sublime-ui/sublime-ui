import { gatherProbes } from '../lib/probe.js';
import { buildDoctorReport } from '../lib/doctor-report.js';
import { log } from '../util/log.js';

export async function doctorCommand(): Promise<number> {
  log.banner('Sublime · Environment doctor');
  const probes = await gatherProbes();
  const report = buildDoctorReport(probes);
  log.table(report.rows);
  if (report.ok) {
    log.success('Environment ready — run: sublime build');
    return 0;
  }
  log.warn('Some requirements are missing — run: sublime setup');
  return 1;
}
