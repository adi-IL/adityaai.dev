export interface UpstreamReceipt {
  org: string;
  repo: string;
  pr: number;
  issue: string;
  fix: string;
  url: string;
}

/** Curated merged upstream PRs. Static list. Not a live GitHub feed. */
export const upstreamReceipts: UpstreamReceipt[] = [
  {
    org: 'tensorflow',
    repo: 'tensorflow',
    pr: 125859,
    issue:
      'A convolution with an invalid rank aborted the Python process instead of returning an error.',
    fix: 'Raise ValueError so callers can catch the bad shape and keep the process alive.',
    url: 'https://github.com/tensorflow/tensorflow/pull/125859',
  },
  {
    org: 'tensorflow',
    repo: 'tensorflow',
    pr: 126449,
    issue:
      'XLA RangeOp under jit_compile had no path for half, bfloat16, or integer dtypes, so those ranges failed at compile time.',
    fix: 'Wire the missing dtype handlers so Range works under XLA for those types.',
    url: 'https://github.com/tensorflow/tensorflow/pull/126449',
  },
  {
    org: 'google',
    repo: 'mug',
    pr: 130,
    issue:
      'Regex escape handling swallowed malformed input, and the error suite never ran because the files were named *Tests.java instead of *Test.java.',
    fix: 'Fail on bad escapes, and rename the suite so Surefire actually executes it.',
    url: 'https://github.com/google/mug/pull/130',
  },
  {
    org: 'grafana',
    repo: 'grafana',
    pr: 131335,
    issue:
      'Value-mapping range inputs rejected minus signs, so you could not set a negative lower or upper bound.',
    fix: 'Accept signed numbers in the range fields so negative bounds type normally.',
    url: 'https://github.com/grafana/grafana/pull/131335',
  },
];
