"use client";

import { useEffect, useState } from "react";

export default function AgentationProvider() {
  const [Component, setComponent] = useState<React.ComponentType<{ endpoint: string }> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    import("agentation")
      .then((mod) => setComponent(() => mod.Agentation))
      .catch(() => {});
  }, []);

  if (!Component) return null;
  return <Component endpoint="http://localhost:4747" />;
}
