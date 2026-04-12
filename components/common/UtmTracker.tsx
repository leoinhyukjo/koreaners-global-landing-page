"use client";

import { useEffect } from "react";
import { captureUtmFromUrl } from "@/lib/utm-tracking";

export function UtmTracker() {
  useEffect(() => {
    captureUtmFromUrl();
  }, []);
  return null;
}
