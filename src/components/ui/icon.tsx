import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "search"
  | "arrow-right"
  | "arrow-left"
  | "arrow-up-right"
  | "plus"
  | "pin"
  | "calendar"
  | "bag"
  | "hand"
  | "menu"
  | "close"
  | "check"
  | "check-circle"
  | "upload"
  | "image"
  | "clock"
  | "shield"
  | "camera"
  | "key"
  | "tag"
  | "info"
  | "mail"
  | "phone"
  | "user"
  | "logout"
  | "clipboard"
  | "inbox"
  | "lock"
  | "list"
  | "chevron-down";

type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

/**
 * One stroke-based icon family for the whole product. Every glyph is drawn on
 * a 24 px grid with the same 1.8 stroke so icons from different screens sit
 * together without visual weight changes.
 */
export function Icon({ name, ...props }: IconProps) {
  const common = {
    className: "icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false,
    ...props,
  };

  const shapes: Record<IconName, ReactNode> = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
    "arrow-right": <><path d="M4.5 12h15" /><path d="m13 5.5 6.5 6.5-6.5 6.5" /></>,
    "arrow-left": <><path d="M19.5 12h-15" /><path d="m11 5.5-6.5 6.5 6.5 6.5" /></>,
    "arrow-up-right": <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M16 3v4M8 3v4M3.5 10h17" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    hand: <><path d="M8 12V5a1.6 1.6 0 0 1 3.2 0v6-8a1.6 1.6 0 0 1 3.2 0v8-6a1.6 1.6 0 0 1 3.2 0v7-3a1.6 1.6 0 0 1 3.2 0v5.3a7.7 7.7 0 0 1-7.7 7.7h-.6a7.7 7.7 0 0 1-6.3-3.3L3.6 15a1.8 1.8 0 0 1 2.8-2.2L8 14.5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    "check-circle": <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 9" /></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    camera: <><path d="M4 7h3l1.5-2h7L17 7h3v13H4V7Z" /><circle cx="12" cy="13" r="3.5" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 2 2-2 2 2 2-3 3-2-2-2 2" /></>,
    tag: <><path d="M20.5 13 13 20.5 3.5 11V3.5H11l9.5 9.5Z" /><circle cx="8" cy="8" r="1" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    logout: <><path d="M10 4H5v16h5" /><path d="m14 8 4 4-4 4" /><path d="M9 12h9" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 10h6M9 14h4" /></>,
    inbox: <><path d="M4 13h4l2 3h4l2-3h4" /><path d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" /><path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
  };

  return <svg {...common}>{shapes[name]}</svg>;
}
