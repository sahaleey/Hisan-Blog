"use client";

import { useEffect } from "react";

export function ViewTracker({ workId }: { workId: string }) {
  useEffect(() => {
    void fetch(`/api/views?workId=${encodeURIComponent(workId)}`, {
      method: "POST",
      credentials: "same-origin",
    });
  }, [workId]);
  return null;
}
