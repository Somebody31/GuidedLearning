// Course atlas page (map of units and lessons).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { AtlasView } from "@/components/atlas/atlas-view";
import { getCourse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let title = "Course";
  try {
    const course = await getCourse(id);
    if (course) title = course.title;
  } catch {
    /* keep default */
  }
  return { title };
}

export default async function CourseAtlasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let course = null;
  try {
    course = await getCourse(id);
  } catch {
    course = null;
  }
  if (!course) notFound();

  return (
    <AppShell
      courseId={course.id}
      courseTitle={course.title}
      activeNav="atlas"
    >
      <AtlasView course={course} />
    </AppShell>
  );
}
