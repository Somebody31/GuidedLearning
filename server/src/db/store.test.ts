import { describe, expect, test } from "bun:test";
import { MemoryStore } from "./store";

describe("file snapshot", () => {
  test("dump/hydrate keeps a created course", () => {
    const a = new MemoryStore();
    const course = a.createCourse("World History");
    expect(course.kind).toBe("document");
    const coded = a.createCourse("Auth service", "code");
    expect(coded.kind).toBe("code");
    const b = new MemoryStore();
    b.hydrate(a.dump());
    expect(b.getCourse(course.id)?.title).toBe("World History");
    expect(b.getCourse(coded.id)?.kind).toBe("code");
  });

  test("hydrate defaults missing kind to document", () => {
    const a = new MemoryStore();
    const course = a.createCourse("Chem");
    const dump = a.dump();
    const row = dump.courses.find((c) => c.id === course.id);
    if (row) delete (row as { kind?: string }).kind;
    const b = new MemoryStore();
    b.hydrate(dump);
    expect(b.getCourse(course.id)?.kind).toBe("document");
  });

  test("hydrate marks in-flight parse sources failed", () => {
    const a = new MemoryStore();
    const course = a.createCourse("Chem");
    const mut = a.getCourseMutable(course.id);
    mut?.sources.push({
      id: "src-test",
      name: "notes.txt",
      pages: 0,
      status: "parsing",
      storageKey: "uploads/x",
      bytes: 12,
    });
    const b = new MemoryStore();
    b.hydrate(a.dump());
    expect(b.getCourseMutable(course.id)?.sources[0]?.status).toBe("failed");
  });
});
