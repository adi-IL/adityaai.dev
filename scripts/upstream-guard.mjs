// Banned-term guard for the /upstream page, shared with the adi-IL profile build.
// Each entry is the sha256 of a banned term (lowercase, letters and digits only) and its length.
// Text is lowercased, stripped to [a-z0-9], and every window of each length is hashed.
import { createHash } from 'node:crypto';

export const GUARD_TERMS = [
  ['1a79668eac4051a9128b81c116007d1b41ce17828d7722afc9746699f4e817b8', 6],
  ['2b7847b7b705781d7cf21a05e9c1bb37cbf078aea103bc3edcc6aca52ab65453', 8],
  ['13f0d18dd168fd715bc57125445b3f8daf651fc2920601b02dba63fa7a72280a', 15],
  ['7ee80abab4254b00a1bb94f9ca89406be9bb782abde64bc6cce5e90e4eb4f516', 19],
];

export function guardHits(text, terms = GUARD_TERMS) {
  const norm = String(text).toLowerCase().replace(/[^a-z0-9]/g, '');
  const hits = [];
  for (const [digest, length] of terms) {
    for (let i = 0; i + length <= norm.length; i++) {
      if (createHash('sha256').update(norm.slice(i, i + length)).digest('hex') === digest) {
        hits.push({ digest: digest.slice(0, 12), index: i });
        break;
      }
    }
  }
  return hits;
}
