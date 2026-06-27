import { useRef, useState } from "react";

interface FileUploadProps {
  onUploaded: (filename: string) => void;
}

export function FileUpload({ onUploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are supported");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        const data = await res.json();
        onUploaded(data.filename);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setUploading(false);
  };

  return (
    <div
      className="rounded-lg border-2 border-dashed border-black/20 p-6 text-center cursor-pointer hover:border-black/40 transition"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <p className="font-type text-sm text-muted-foreground">Uploading...</p>
      ) : (
        <>
          <p className="font-type text-sm text-muted-foreground uppercase tracking-[0.2em]">
            Drop PDFs here or click to upload
          </p>
          <p className="mt-1 font-type text-xs text-muted-foreground">
            New witness statements will appear in the selector above
          </p>
        </>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-500 font-type">{error}</p>
      )}
    </div>
  );
}
