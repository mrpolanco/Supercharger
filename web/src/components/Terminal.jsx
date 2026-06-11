import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function Terminal({ session }) {
  const ref = useRef(null);

  useEffect(() => {
    const term = new XTerm({
      fontSize: 13,
      fontFamily: "SF Mono, Menlo, monospace",
      theme: { background: "#0d1117" },
      cursorBlink: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/term?session=${session}`);
    ws.onopen = () => {
      ws.send(`\x00resize:${term.cols}x${term.rows}`);
      term.focus();
    };
    ws.onmessage = (e) => term.write(e.data);
    ws.onclose = () => term.write("\r\n\x1b[90m[session ended]\x1b[0m\r\n");
    term.onData((d) => ws.readyState === 1 && ws.send(d));

    const onResize = () => {
      fit.fit();
      if (ws.readyState === 1) ws.send(`\x00resize:${term.cols}x${term.rows}`);
    };
    window.addEventListener("resize", onResize);
    const obs = new ResizeObserver(onResize);
    obs.observe(ref.current);

    return () => {
      window.removeEventListener("resize", onResize);
      obs.disconnect();
      ws.close();
      term.dispose();
    };
  }, [session]);

  return <div className="terminal" ref={ref} />;
}
