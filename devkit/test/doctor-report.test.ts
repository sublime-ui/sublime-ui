import { describe, it, expect } from 'vitest';
import { buildDoctorReport, type Probes } from '../src/lib/doctor-report.js';

const fullyEquipped: Probes = {
  node: 'v24.16.0',
  jdk17: '17.0.13',
  androidHome: 'C:\\Users\\Public\\Android\\Sdk',
  sdkmanager: true,
  platformTools: true,
  ndk: '27.1.12297006',
  cmake: '3.22.1',
};

describe('buildDoctorReport', () => {
  it('reports all-green for a fully equipped env', () => {
    const report = buildDoctorReport(fullyEquipped);
    expect(report.ok).toBe(true);
    expect(report.rows.every((r) => r.ok)).toBe(true);
    expect(report.rows).toHaveLength(7);
  });

  it('annotates the ANDROID_HOME and JDK rows with their source', () => {
    const report = buildDoctorReport({
      ...fullyEquipped,
      androidHomeSource: 'managed',
      jdkSource: 'managed',
    });
    const androidRow = report.rows.find((r) => r.label.includes('ANDROID_HOME'));
    const jdkRow = report.rows.find((r) => r.label.includes('JDK'));
    expect(androidRow?.detail).toContain('(managed)');
    expect(jdkRow?.detail).toContain('(managed)');
  });

  it('flags a broken env and is not ok', () => {
    const report = buildDoctorReport({
      ...fullyEquipped,
      jdk17: '1.8.0_202', // too old
      ndk: null, // missing
      cmake: '3.18.1', // wrong version
    });
    expect(report.ok).toBe(false);
    const jdkRow = report.rows.find((r) => r.label.includes('JDK'));
    const ndkRow = report.rows.find((r) => r.label.includes('NDK'));
    const cmakeRow = report.rows.find((r) => r.label.includes('CMake'));
    expect(jdkRow?.ok).toBe(false);
    expect(ndkRow?.ok).toBe(false);
    expect(cmakeRow?.ok).toBe(false);
  });
});
