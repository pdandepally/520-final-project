/**
 * Hook for translating job content on the client side
 */

import { useState, useEffect } from "react";

interface TranslatableJob {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  payRate?: string | null;
  requirements?: string | null;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  employer?: string;
  position?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  userId?: string;
}

export function useTranslatedJobs<T extends TranslatableJob>(
  jobs: T[] | undefined,
) {
  const [translatedJobs, setTranslatedJobs] = useState<T[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!jobs || jobs.length === 0) {
      setTranslatedJobs([]);
      return;
    }

    // Translation disabled - just return original jobs
    setTranslatedJobs(jobs);
    setIsTranslating(false);
  }, [jobs]);

  return { translatedJobs, isTranslating };
}
