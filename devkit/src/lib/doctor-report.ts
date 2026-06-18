import {
  REQUIREMENTS,
  satisfiesMajor,
  satisfiesExact,
} from './requirements.js';
import type { TableRow } from '../util/log.js';

export interface Probes {
  node: string | null;
  jdk17: string | null;
  androidHome: string | null;
  sdkmanager: boolean;
  platformTools: boolean;
  ndk: string | null;
  cmake: string | null;
}

export interface DoctorReport {
  rows: TableRow[];
  ok: boolean;
}

export function buildDoctorReport(probes: Probes): DoctorReport {
  const rows: TableRow[] = [
    {
      label: 'Node >=18',
      ok: satisfiesMajor(probes.node, REQUIREMENTS.node.min),
      detail: probes.node ?? 'not found',
    },
    {
      label: 'JDK 17',
      ok: satisfiesMajor(probes.jdk17, REQUIREMENTS.jdk.major),
      detail: probes.jdk17 ?? 'not found (run: sublime setup)',
    },
    {
      label: 'ANDROID_HOME',
      ok: probes.androidHome !== null,
      detail: probes.androidHome ?? 'not set',
    },
    {
      label: 'sdkmanager',
      ok: probes.sdkmanager,
      detail: probes.sdkmanager ? 'cmdline-tools present' : 'missing',
    },
    {
      label: 'platform-tools',
      ok: probes.platformTools,
      detail: probes.platformTools ? 'adb present' : 'missing',
    },
    {
      label: `NDK ${REQUIREMENTS.ndk}`,
      ok: satisfiesExact(probes.ndk, REQUIREMENTS.ndk),
      detail: probes.ndk ?? 'missing (auto-installed on build)',
    },
    {
      label: `CMake ${REQUIREMENTS.cmake}`,
      ok: satisfiesExact(probes.cmake, REQUIREMENTS.cmake),
      detail: probes.cmake ?? 'missing (auto-installed on build)',
    },
  ];
  return { rows, ok: rows.every((r) => r.ok) };
}
