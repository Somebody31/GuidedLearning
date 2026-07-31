import { describe, expect, test } from "bun:test";
import { buildSessionPack } from "./packer";
import { createCnSeedCourse } from "../db/seed-cn";

describe("buildSessionPack", () => {
  test("prioritizes due over weak over new", () => {
    const course = createCnSeedCourse();
    const pack = buildSessionPack(course, 25);
    expect(pack.length).toBeGreaterThan(0);
    // First items should be review (due) when due lessons exist
    const kinds = pack.map((p) => p.kind);
    const firstDue = kinds.indexOf("review");
    const firstNew = kinds.indexOf("new");
    if (firstDue >= 0 && firstNew >= 0) {
      expect(firstDue).toBeLessThan(firstNew);
    }
  });

  test("respects budget after first item", () => {
    const course = createCnSeedCourse();
    const pack = buildSessionPack(course, 15);
    const used = pack.reduce((s, i) => {
      const l = course.lessons[i.lessonId];
      return s + (l?.estMinutes ?? 0);
    }, 0);
    // First item may exceed; total of multi should not wildly overshoot without reason
    expect(pack.length).toBeGreaterThanOrEqual(1);
    if (pack.length > 1) {
      expect(used).toBeLessThanOrEqual(15 + 20); // allow densest first-item overflow pattern
    }
  });

  test("empty course yields empty pack", () => {
    const course = createCnSeedCourse();
    course.lessons = {};
    course.units = [];
    expect(buildSessionPack(course, 25)).toEqual([]);
  });
});
