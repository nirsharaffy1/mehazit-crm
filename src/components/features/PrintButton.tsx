"use client";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-ghost text-xs flex items-center gap-1.5 print:hidden"
    >
      <Printer size={14} /> הדפס / PDF
    </button>
  );
}
