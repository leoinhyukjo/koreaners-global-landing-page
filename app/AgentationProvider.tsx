"use client";

import { useEffect, useState } from "react";

export default function AgentationProvider() {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    // @ts-ignore - agentation is a devDependency, not available in production
    import("agentation")
      .then((mod: any) => setComponent(() => mod.Agentation))
      .catch(() => {});
  }, []);

  if (!Component) return null;
  return <Component endpoint="http://localhost:4747" />;
}
