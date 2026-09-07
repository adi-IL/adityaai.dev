export interface UpstreamReceipt {
  org: string;
  repo: string;
  summary: string;
  url: string;
}

/** Curated merged upstream PRs. Static list. Not a live GitHub feed. */
export const upstreamReceipts: UpstreamReceipt[] = [
  {
    org: 'tensorflow',
    repo: 'tensorflow',
    summary:
      'Invalid convolution shapes used to abort the process. Now raises ValueError.',
    url: 'https://github.com/tensorflow/tensorflow/pull/125859',
  },
  {
    org: 'tensorflow',
    repo: 'tensorflow',
    summary:
      'XLA RangeOp missed half, bfloat16, and integer dtypes under jit_compile.',
    url: 'https://github.com/tensorflow/tensorflow/pull/126449',
  },
  {
    org: 'google',
    repo: 'mug',
    summary:
      'Regex escapes swallowed malformed input. Error suite was not running.',
    url: 'https://github.com/google/mug/pull/130',
  },
  {
    org: 'grafana',
    repo: 'grafana',
    summary: 'Could not type negative bounds in value-mapping ranges.',
    url: 'https://github.com/grafana/grafana/pull/131335',
  },
];
