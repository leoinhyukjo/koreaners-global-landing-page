// components/consult/channel-talk.tsx
"use client";

import { useEffect } from "react";

const PLUGIN_KEY = process.env.NEXT_PUBLIC_CHANNELIO_PLUGIN_KEY;

declare global {
  interface Window {
    ChannelIO?: ((...args: unknown[]) => void) & { c?: (args: unknown) => void; q?: unknown[] };
    ChannelIOInitialized?: boolean;
  }
}

export function ChannelTalk() {
  useEffect(() => {
    if (!PLUGIN_KEY || window.ChannelIOInitialized) return;

    // 채널톡 공식 부트 스니펫 (https://developers.channel.io 기준)
    const w = window;
    const ch = function (...args: unknown[]) {
      ch.c?.(args);
    } as NonNullable<Window["ChannelIO"]>;
    ch.q = [];
    ch.c = function (args: unknown) {
      ch.q?.push(args);
    };
    w.ChannelIO = ch;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    document.head.appendChild(script);

    w.ChannelIOInitialized = true;
    w.ChannelIO("boot", { pluginKey: PLUGIN_KEY });

    return () => {
      w.ChannelIO?.("shutdown");
      w.ChannelIOInitialized = false;
    };
  }, []);

  return null;
}
