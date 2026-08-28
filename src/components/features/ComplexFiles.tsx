"use client";
import { useState } from "react";
import { Paperclip, Plus, Trash2, ExternalLink, X, Loader2, FileText, FileImage, File } from "lucide-react";

interface ComplexFile {
  id: string;
  name: string;
  url: string;
  fileType: string | null;
  createdAt: string;
}

const FILE_TYPES = [
  { value: "taboo", label: "נסח טאבו" },
  { value: "signature", label: "חתימה / יפ״כ" },
  { value: "form", label: "טופס" },
  { value: "image", label: "תמונה" },
  { value: "other", label: "אחר" },
];

function fileIcon(type: string | null) {
  if (type === "image") return <FileImage size={14} className="text-blue-500" />;
  if (type === "taboo" || type === "form" || type === "signature") return <FileText size={14} className="text-amber-500" />;
  return <File size={14} className="text-dark/40 dark:text-cream/40" />;
}

function fileTypeLabel(type: string | null) {
  return FILE_TYPES.find(t => t.value === type)?.label ?? "קובץ";
}

interface Props {
  complexId: string;
  initialFiles: ComplexFile[];
  canEdit: boolean;
}

export default function ComplexFiles({ complexId, initialFiles, canEdit }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", fileType: "other" });
  const [loading, setLoading] = useState(false);

  async function addFile() {
    if (!form.name.trim() || !form.url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/complexes/${complexId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const { file } = await res.json();
      setFiles(f => [{ ...file, createdAt: file.createdAt }, ...f]);
      setForm({ name: "", url: "", fileType: "other" });
      setAdding(false);
    } finally {
      setLoading(false);
    }
  }

  async function deleteFile(id: string) {
    if (!confirm("למחוק קובץ זה?")) return;
    await fetch(`/api/complexes/${complexId}/files/${id}`, { method: "DELETE" });
    setFiles(f => f.filter(x => x.id !== id));
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title flex items-center gap-2">
          <Paperclip size={16} className="text-gold" /> מסמכים וקבצים ({files.length})
        </h2>
        {canEdit && !adding && (
          <button onClick={() => setAdding(true)} className="btn-ghost text-xs flex items-center gap-1.5">
            <Plus size={13} /> הוסף קובץ
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3 p-3 rounded-lg bg-offwhite dark:bg-dark-soft border border-line space-y-2">
          <div className="grid md:grid-cols-2 gap-2">
            <input
              className="input text-sm"
              placeholder="שם הקובץ (למשל: נסח טאבו - ינואר 2026)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
            <select
              className="input text-sm"
              value={form.fileType}
              onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}
            >
              {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <input
            className="input text-sm ltr"
            placeholder="קישור לקובץ (Google Drive, Dropbox, כל URL...)"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            dir="ltr"
          />
          <div className="flex gap-2">
            <button
              onClick={addFile}
              disabled={loading || !form.name.trim() || !form.url.trim()}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              הוסף
            </button>
            <button onClick={() => setAdding(false)} className="btn-ghost text-xs">
              <X size={13} /> ביטול
            </button>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-6">
          <Paperclip size={28} className="text-dark/15 dark:text-cream/15 mx-auto mb-2" />
          <p className="text-xs text-dark/40 dark:text-cream/40">אין מסמכים מצורפים</p>
          {canEdit && (
            <p className="text-xs text-dark/30 dark:text-cream/30 mt-1">
              ניתן לצרף קישורי Google Drive, Dropbox וכדומה
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-offwhite dark:bg-dark-soft group">
              {fileIcon(f.fileType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark dark:text-cream truncate">{f.name}</p>
                <p className="text-xs text-dark/40 dark:text-cream/40">{fileTypeLabel(f.fileType)}</p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold/70 transition-colors flex-shrink-0"
                title="פתח קובץ"
              >
                <ExternalLink size={14} />
              </a>
              {canEdit && (
                <button
                  onClick={() => deleteFile(f.id)}
                  className="text-dark/20 dark:text-cream/20 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  title="מחק קובץ"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
