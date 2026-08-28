"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

interface Props {
  assignmentId: string;
  userName: string;
  onCancelled?: () => void;
}

export default function CancelAssignmentButton({ assignmentId, userName, onCancelled }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
      if (res.ok) {
        onCancelled?.();
        router.refresh();
      }
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-dark/50 dark:text-cream/50">לבטל שיבוץ של {userName}?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-60"
        >
          {loading ? <Loader2 size={11} className="animate-spin inline" /> : "כן"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-0.5 rounded-md border border-line text-dark/50 dark:text-cream/50 hover:bg-offwhite dark:hover:bg-dark-soft"
        >
          לא
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-dark/20 dark:text-cream/20 hover:text-red-500 transition-colors"
      title={`בטל שיבוץ של ${userName}`}
    >
      <X size={14} />
    </button>
  );
}
