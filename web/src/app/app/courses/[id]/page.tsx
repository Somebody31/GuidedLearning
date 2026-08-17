// Course home: Today — the next sitting, then the path.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { CourseToday } from "@/components/desk/course-today";
import { getCourse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let title = "Today";
  try {
    const course = await getCourse(id);
    if (course) title = course.title;
  } catch {
    /* keep default */
  }
  return { title };
}

export default async function CourseTodayPage({
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
      activeNav="today"
    >
      <CourseToday course={course} />
    </AppShell>
  );
}
