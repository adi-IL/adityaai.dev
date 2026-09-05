import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVertexProject } from '../lib/vertex.ts';

const KEYS = [
  'GCP_PROJECT_ID',
  'GOOGLE_CLOUD_PROJECT',
  'GCLOUD_PROJECT',
  'VITE_GCP_PROJECT_ID',
  'GCP_PROJECT',
] as const;

function withProjectEnv(
  extra: Record<string, string>,
  fn: () => void,
): void {
  const saved: Record<string, string | undefined> = {};
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(extra)) {
    process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

describe('getVertexProject', () => {
  it('returns empty when no project env is set', () => {
    withProjectEnv({}, () => {
      assert.equal(getVertexProject(), '');
    });
  });

  it('reads GCP_PROJECT_ID from env', () => {
    withProjectEnv({ GCP_PROJECT_ID: 'example-project' }, () => {
      assert.equal(getVertexProject(), 'example-project');
    });
  });
});
