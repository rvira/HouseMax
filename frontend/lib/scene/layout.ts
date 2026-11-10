/**
 * Pure site geometry + setback check, shared by the 3D scene and the 2D overlays.
 * World units are feet. The lot is centred on the origin; the street (front) is +Z, the rear line is −Z.
 * No three.js imports here, so this stays testable and cheap to run on every drag frame.
 */

export const STATE_MIN_SETBACK = 4; // Gov. Code § 66314(d)(7)
export const ADU_HEIGHT_FLOOR = 16; // what every city must allow
export const ADU_HEIGHT_FLOOR_TRANSIT = 18; // within ½ mile of major transit

export interface SiteInputs {
  lotWidth: number;
  lotLength: number;
  primaryWidth: number;
  primaryLength: number;
  primaryHeight: number;
  frontSetback: number;
  aduWidth: number;
  aduLength: number;
  aduHeight: number;
  /** Required no-build buffers. */
  requiredRear: number;
  requiredSide: number;
  /** Proposed position: rear line → ADU rear wall, left side line → ADU left wall. */
  aduRearOffset: number;
  aduSideOffset: number;
}

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type ViolationId = "rear" | "side" | "lot" | "house";

export interface SiteLayout {
  lot: Rect;
  house: Rect & { height: number };
  adu: Rect & { height: number };
  zones: { left: Rect; right: Rect; rear: Rect };
  /** Which setback zones the ADU currently intrudes into (for highlighting). */
  zoneHits: { left: boolean; right: boolean; rear: boolean };
  violations: { id: ViolationId; label: string }[];
}

export const rectCenter = (r: Rect) => ({ x: (r.minX + r.maxX) / 2, z: (r.minZ + r.maxZ) / 2 });
export const rectSize = (r: Rect) => ({ w: r.maxX - r.minX, l: r.maxZ - r.minZ });

/** Strict overlap: touching edges do not count. */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function computeSiteLayout(c: SiteInputs): SiteLayout {
  const W = Math.max(10, c.lotWidth);
  const L = Math.max(10, c.lotLength);
  const left = -W / 2;
  const right = W / 2;
  const rear = -L / 2;
  const front = L / 2;
  const side = Math.min(Math.max(0, c.requiredSide), W / 2);
  const back = Math.min(Math.max(0, c.requiredRear), L);

  const pw = Math.min(c.primaryWidth, W);
  const pl = Math.min(c.primaryLength, L);
  const pz = Math.min(front - c.frontSetback - pl / 2, front - pl / 2);
  const house = { minX: -pw / 2, maxX: pw / 2, minZ: pz - pl / 2, maxZ: pz + pl / 2, height: c.primaryHeight };

  const zones = {
    left: { minX: left, maxX: left + side, minZ: rear, maxZ: front },
    right: { minX: right - side, maxX: right, minZ: rear, maxZ: front },
    rear: { minX: left, maxX: right, minZ: rear, maxZ: rear + back },
  };

  const ax = left + c.aduSideOffset;
  const az = rear + c.aduRearOffset;
  const adu = { minX: ax, maxX: ax + c.aduWidth, minZ: az, maxZ: az + c.aduLength, height: c.aduHeight };

  const zoneHits = {
    left: overlaps(adu, zones.left),
    right: overlaps(adu, zones.right),
    rear: overlaps(adu, zones.rear),
  };

  const violations: SiteLayout["violations"] = [];
  if (zoneHits.rear) violations.push({ id: "rear", label: `Rear setback (${back} ft)` });
  if (zoneHits.left || zoneHits.right) violations.push({ id: "side", label: `Side setback (${side} ft)` });
  if (adu.minX < left || adu.maxX > right || adu.minZ < rear || adu.maxZ > front) violations.push({ id: "lot", label: "Outside the lot line" });
  if (overlaps(adu, house)) violations.push({ id: "house", label: "Overlaps the primary residence" });

  return { lot: { minX: left, maxX: right, minZ: rear, maxZ: front }, house, adu, zones, zoneHits, violations };
}

/** Convert an ADU centre position (world XZ) back to the offsets the project stores, snapped to ½ ft. */
export function centerToOffsets(c: Pick<SiteInputs, "lotWidth" | "lotLength" | "aduWidth" | "aduLength">, x: number, z: number) {
  const snap = (n: number) => Math.round(n * 2) / 2;
  return {
    aduSideOffset: snap(x - c.aduWidth / 2 + c.lotWidth / 2),
    aduRearOffset: snap(z - c.aduLength / 2 + c.lotLength / 2),
  };
}
