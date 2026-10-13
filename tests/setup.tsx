import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// next/image renders a plain <img> in tests (no optimizer, no `fill` layout).
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const dropped = ["fill", "unoptimized", "priority", "sizes"];
    const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !dropped.includes(key)));
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

// Components read the pathname and router; pages are rendered without the App Router.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom has no URL.createObjectURL; the ImageUploader preview needs it.
if (!("createObjectURL" in URL)) {
  Object.defineProperty(URL, "createObjectURL", { value: () => "blob:preview", writable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: () => undefined, writable: true });
}
