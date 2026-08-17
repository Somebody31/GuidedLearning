"use client";

// Load one course from the API (any subject).

import { useEffect, useState } from "react";
import { getCourse } from "./api";
import type { Course } from "./types";

export function useCourse(id: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getCourse(id)
      .then((c) => {
        if (cancelled) return;
        setCourse(c);
        if (!c) setError("not-found");
      })
      .catch((e) => {
        if (cancelled) return;
        setCourse(null);
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { course, loading, error, setCourse };
}