import { computeSiteLayout, rectCenter, type SiteInputs } from "@byright/lib/scene/layout";

/**
 * The demo project from the app (frontend/data/projects.json → "Eastside Residential Detached ADU"):
 * 50 × 136 ft Santa Ana lot, 800 sq ft detached ADU (20 × 40 ft), 17.5 ft tall, 4 ft rear/side setbacks.
 * Massing assumptions match the app's DEFAULT_SITE.
 */
export const DEMO: SiteInputs = {
  lotWidth: 50,
  lotLength: 136,
  primaryWidth: 34,
  primaryLength: 42,
  primaryHeight: 22,
  frontSetback: 20,
  aduWidth: 20,
  aduLength: 40,
  aduHeight: 17.5,
  requiredRear: 4,
  requiredSide: 4,
  aduRearOffset: 4,
  aduSideOffset: 4,
};

export const DEMO_LAYOUT = computeSiteLayout(DEMO);
const c = rectCenter(DEMO_LAYOUT.adu);
/** Where the lens usually wants to be: the middle of the compliant ADU. */
export const ADU_FOCUS: [number, number, number] = [c.x, DEMO.aduHeight / 2, c.z];
