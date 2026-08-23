"use client";
import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-line bg-offwhite dark:bg-dark-soft flex items-center justify-center" style={{ height: 520 }}>
      <p className="text-dark/40 dark:text-cream/40 text-sm">טוען מפה...</p>
    </div>
  ),
});

export default MapClient;
