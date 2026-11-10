import { describe, expect, it } from "vitest";
import { centerToOffsets, computeSiteLayout, rectCenter, type SiteInputs } from "@/lib/scene/layout";

const base: SiteInputs = {
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

const ids = (i: SiteInputs) => computeSiteLayout(i).violations.map((v) => v.id);

describe("computeSiteLayout", () => {
  it("passes when the ADU sits exactly on the setback lines (touching is not intruding)", () => {
    expect(ids(base)).toEqual([]);
  });

  it("flags rear and side intrusions independently", () => {
    expect(ids({ ...base, aduRearOffset: 3.5 })).toEqual(["rear"]);
    expect(ids({ ...base, aduSideOffset: 2 })).toEqual(["side"]);
    expect(ids({ ...base, aduSideOffset: base.lotWidth - base.aduWidth - 1 })).toEqual(["side"]);
  });

  it("flags leaving the lot and overlapping the house", () => {
    expect(ids({ ...base, aduSideOffset: -1 })).toContain("lot");
    // House front face sits frontSetback from the street; push the ADU up to it.
    expect(ids({ ...base, aduRearOffset: 70 })).toContain("house");
  });

  it("highlights only the zones actually hit", () => {
    const { zoneHits } = computeSiteLayout({ ...base, aduSideOffset: 1, aduRearOffset: 1 });
    expect(zoneHits).toEqual({ left: true, right: false, rear: true });
  });

  it("round-trips centre → offsets (snapped to ½ ft) for drag commits", () => {
    const { adu } = computeSiteLayout({ ...base, aduRearOffset: 12.5, aduSideOffset: 9 });
    const c = rectCenter(adu);
    expect(centerToOffsets(base, c.x + 0.2, c.z - 0.1)).toEqual({ aduRearOffset: 12.5, aduSideOffset: 9 });
  });
});
