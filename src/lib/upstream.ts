export interface UpstreamReceipt {
  org: string;
  repo: string;
  pr: number;
  issue: string;
  fix: string;
  url: string;
  /** One-line summary for llms.txt. */
  short: string;
}

/** Curated merged upstream PRs. Static list. Not a live GitHub feed. */
export const upstreamReceipts: UpstreamReceipt[] = [
  {
    org: 'gvisor',
    repo: 'gvisor',
    pr: 14401,
    issue:
      'Any user in the sandbox could destroy another user\'s shared memory segment with shmctl(IPC_RMID). The ownership check Linux runs was missing.',
    fix: 'Allow removal only by the creator, the owner, or a caller with CAP_SYS_ADMIN, and return EPERM otherwise, as Linux does.',
    url: 'https://github.com/gvisor/gvisor/pull/14401',
    short: 'shmctl(IPC_RMID) let any user destroy another user\'s shared memory; now checks ownership',
  },
  {
    org: 'tensorflow',
    repo: 'tensorflow',
    pr: 127438,
    issue:
      'TensorListScatter sized its list as the highest index plus one in a signed int, so an index of INT32_MAX overflowed before the resize.',
    fix: 'Reject that index with InvalidArgument, as the sibling op already did, and compute the new length without overflow.',
    url: 'https://github.com/tensorflow/tensorflow/pull/127438',
    short: 'INT32_MAX index overflowed the TensorListScatter resize; now rejected',
  },
  {
    org: 'tensorflow',
    repo: 'tensorflow',
    pr: 126688,
    issue:
      'When Grappler fused MatMul or Conv2D with a bias shaped like [1, N], the fused CPU and GPU kernels demanded a 1-D bias and failed inside tf.function.',
    fix: 'Accept any bias whose leading dimensions are all 1, matching the remapper and the oneDNN kernel.',
    url: 'https://github.com/tensorflow/tensorflow/pull/126688',
    short: 'fused MatMul/Conv2D failed on [1, N] bias inside tf.function; CPU and GPU kernels now accept it',
  },
  {
    org: 'gvisor',
    repo: 'gvisor',
    pr: 15301,
    issue:
      'One RTM_DELROUTE request removed every matching route from the sandbox network stack. Linux removes only the first match.',
    fix: 'Stop after the first matching route, so each delete removes one route and an extra delete returns ESRCH.',
    url: 'https://github.com/gvisor/gvisor/pull/15301',
    short: 'one route delete could remove several routes in netstack; now removes only the first match',
  },
];
