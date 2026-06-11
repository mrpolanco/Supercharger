import React from "react";
import * as Icons from "@duo-icons/react";

// Map our short names to @duo-icons/react components. Add entries here as
// new icons are needed; full list: https://github.com/fazdiu/duo-icons
const icons = {
  add: Icons.AddCircle,
  app: Icons.App,
  approved: Icons.Approved,
  book: Icons.Book,
  rocket: Icons.Rocket,
  target: Icons.Target,
  alert: Icons.AlertTriangle,
  award: Icons.Award,
  briefcase: Icons.Briefcase,
  bug: Icons.Bug,
  certificate: Icons.Certificate,
  chart: Icons.ChartPie,
  chip: Icons.Chip,
  clipboard: Icons.Clipboard_2,
  clock: Icons.Clock,
  compass: Icons.Compass,
  creditcard: Icons.CreditCard,
  dashboard: Icons.Dashboard,
  disk: Icons.Disk,
  file: Icons.File_2,
  fire: Icons.Fire,
  folder: Icons.FolderOpen,
  info: Icons.Info,
  message: Icons.Message2,
  moon: Icons.MoonStars,
  sun: Icons.Sun,
  palette: Icons.Palette,
  settings: Icons.Settings,
  smartphone: Icons.Smartphone,
  translation: Icons.Translation,
  upload: Icons.UploadFile,
  user: Icons.User,
  world: Icons.World,
};

// keyword → icon name, first match wins (checked against title + id + description)
const topicRules = [
  [/sql|database|postgres|query|db\b/, "disk"],
  [/api|http|rest|webhook|openapi|endpoint/, "world"],
  [/debug|troubleshoot|bug|error|incident/, "bug"],
  [/terminal|cli|curl|command|shell|bash|linux/, "chip"],
  [/support|ticket|customer|escalat|communicat/, "message"],
  [/interview|screen|hiring/, "certificate"],
  [/resume|cv\b/, "user"],
  [/analytic|metric|report|data\b|chart/, "chart"],
  [/billing|payment|invoice|subscription/, "creditcard"],
  [/ios|swift|mobile|android|app\b/, "smartphone"],
  [/log|monitor|observab|dashboard/, "dashboard"],
  [/auth|security|token|oauth/, "settings"],
  [/localiz|translat|i18n|language/, "translation"],
  [/design|ui\b|ux\b|css/, "palette"],
  [/deploy|release|ship|launch/, "rocket"],
  [/file|export|import|csv|upload/, "upload"],
  [/onboard|docs|documentation|product/, "folder"],
  [/time|schedule|sla\b/, "clock"],
];

// Pick a relevant icon name from free text (track title/description/id).
export function topicIcon(...texts) {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  for (const [re, icon] of topicRules) if (re.test(hay)) return icon;
  return "book";
}

export default function DuoIcon({ name, className = "", title, ...props }) {
  const Icon = icons[name] || Icons.Book;

  return (
    <Icon
      className={`duoicon ${className}`.trim()}
      width="1em"
      height="1em"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
      {...props}
    />
  );
}
