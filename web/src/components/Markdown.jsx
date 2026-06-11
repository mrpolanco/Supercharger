import React, { useEffect, useMemo, useRef } from "react";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

export default function Markdown({ text }) {
  const ref = useRef(null);
  const html = useMemo(() => marked.parse(text), [text]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const buttons = [];

    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const code = pre.querySelector("code");
      if (!code) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn copy-btn-floating";
      button.title = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");
      button.textContent = "⧉";
      button.addEventListener("click", async () => {
        await navigator.clipboard.writeText(code.innerText);
        button.textContent = "Copied";
        button.title = "Copied";
        window.setTimeout(() => {
          button.textContent = "⧉";
          button.title = "Copy";
        }, 1400);
      });
      pre.appendChild(button);
      buttons.push(button);
    });

    return () => buttons.forEach((button) => button.remove());
  }, [html]);

  return <div ref={ref} className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
