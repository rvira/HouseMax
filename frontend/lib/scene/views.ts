/** Route → 3D "view": camera framing, which scene layers are emphasised, and how much room the 2D panel takes. */

export type ViewId = "overview" | "intake" | "flip" | "site-plan" | "ambient";
export type PanelMode = "wide" | "narrow";

export interface ViewSpec {
  /** Camera position as multiples of the lot's larger dimension, relative to the target. */
  camera: [number, number, number];
  /** Look-at point in feet; `"adu"` follows the ADU. */
  target: "lot" | "adu";
  autoRotate: boolean;
  heightEnvelope: boolean;
  setbacks: "strong" | "subtle";
  labels: boolean;
  panel: PanelMode;
}

export const VIEWS: Record<ViewId, ViewSpec> = {
  overview: { camera: [1.2, 0.95, 1.5], target: "lot", autoRotate: true, heightEnvelope: false, setbacks: "subtle", labels: false, panel: "wide" },
  intake: { camera: [0.62, 0.42, 0.72], target: "adu", autoRotate: false, heightEnvelope: true, setbacks: "subtle", labels: true, panel: "wide" },
  flip: { camera: [-0.66, 0.45, 0.7], target: "adu", autoRotate: false, heightEnvelope: true, setbacks: "subtle", labels: true, panel: "wide" },
  "site-plan": { camera: [0.22, 1.75, 0.95], target: "lot", autoRotate: false, heightEnvelope: false, setbacks: "strong", labels: true, panel: "narrow" },
  ambient: { camera: [1.45, 0.9, 1.15], target: "lot", autoRotate: true, heightEnvelope: false, setbacks: "subtle", labels: false, panel: "wide" },
};

export function viewForPath(pathname: string): ViewId {
  if (pathname === "/") return "overview";
  if (pathname.startsWith("/intake")) return "intake";
  if (pathname.startsWith("/flip")) return "flip";
  if (pathname.startsWith("/site-plan")) return "site-plan";
  return "ambient";
}
