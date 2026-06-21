import pc from 'picocolors';

export interface TableRow {
  label: string;
  ok: boolean;
  detail: string;
}

/** Pure: builds an aligned ✓/✗ table string (no color codes in content). */
export function renderTable(rows: TableRow[]): string {
  const width = rows.reduce((m, r) => Math.max(m, r.label.length), 0);
  return rows
    .map((r) => {
      const mark = r.ok ? '✓' : '✗';
      return `${mark} ${r.label.padEnd(width)}  ${r.detail}`;
    })
    .join('\n');
}

const isTTY = (): boolean => process.stdout.isTTY === true;

const mb = (n: number): string => (n / (1024 * 1024)).toFixed(1);

/** Pure: `[████░░░░]  50%  5.0/10.0 MB`. */
export function renderProgressBar(received: number, total: number, width = 18): string {
  const ratio = total > 0 ? Math.min(1, received / total) : 0;
  const filled = Math.round(ratio * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const pct = String(Math.round(ratio * 100)).padStart(3);
  const size = total > 0 ? `  ${mb(received)}/${mb(total)} MB` : '';
  return `[${bar}] ${pct}%${size}`;
}

const SPIN_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];

export interface Spinner {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
}

/** A TTY spinner; in non-TTY mode it just prints plain status lines. */
export function spinner(text: string): Spinner {
  let current = text;
  if (!isTTY()) {
    // Non-TTY: emit plain lines with no ANSI escape sequences or control codes.
    console.log(`  … ${current}`);
    return {
      update: (t) => { current = t; console.log(`  … ${t}`); },
      succeed: (t) => console.log(`  ✓ ${t ?? current}`),
      fail: (t) => console.error(`  ✗ ${t ?? current}`),
    };
  }
  let i = 0;
  const render = (): void => {
    process.stdout.write(`\r  ${pc.cyan(SPIN_FRAMES[i % SPIN_FRAMES.length]!)} ${current}   `);
    i += 1;
  };
  const timer = setInterval(render, 80);
  render();
  const stop = (mark: string, t?: string): void => {
    clearInterval(timer);
    process.stdout.write(`\r  ${mark} ${t ?? current}        \n`);
  };
  return {
    update: (t) => { current = t; },
    succeed: (t) => stop(pc.green('✓'), t),
    fail: (t) => stop(pc.red('✗'), t),
  };
}

export const log = {
  info: (m: string): void => console.log(m),
  step: (m: string): void => console.log(pc.cyan(`→ ${m}`)),
  success: (m: string): void => console.log(pc.green(`✓ ${m}`)),
  warn: (m: string): void => console.log(pc.yellow(`! ${m}`)),
  error: (m: string): void => console.error(pc.red(`✗ ${m}`)),
  table: (rows: TableRow[]): void => {
    const width = rows.reduce((m, r) => Math.max(m, r.label.length), 0);
    for (const r of rows) {
      const mark = r.ok ? pc.green('✓') : pc.red('✗');
      console.log(`${mark} ${r.label.padEnd(width)}  ${pc.dim(r.detail)}`);
    }
  },
  banner: (title: string): void => {
    console.log('');
    console.log(pc.bold(pc.cyan(`  ${title}`)));
    console.log('');
  },
  phase: (i: number, total: number, msg: string): void => {
    console.log(pc.bold(`  [${i}/${total}] ${msg}`));
  },
  progress: (received: number, total: number): void => {
    const line = renderProgressBar(received, total);
    if (isTTY()) {
      process.stdout.write(`\r        ${line}`);
    }
    // Non-TTY: stay silent here; phase headers carry progress to keep logs clean.
  },
  progressDone: (): void => {
    if (isTTY()) process.stdout.write('\n');
  },
};
