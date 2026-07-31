import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { AtlasView } from "@/components/atlas/atlas-view";
import { getCourse } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(id);
  return {
    title: course ? course.title : "Course",
  };
}

export default async function CourseAtlasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourse(id);
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
