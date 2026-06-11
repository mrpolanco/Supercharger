import React, { useState } from "react";

export default function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      className={`copy-btn ${className}`.trim()}
      type="button"
      title={copied ? "Copied" : "Copy"}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={copy}
    >
      {copied ? "Copied" : "⧉"}
    </button>
  );
}
