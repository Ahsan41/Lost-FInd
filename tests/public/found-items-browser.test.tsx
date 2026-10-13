import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FoundItemsBrowser } from "@/components/routes/found-items-browser";
import { installFakeApi, ok, publicItems } from "../helpers/fake-api";

function cardNames() {
  return screen
    .queryAllByRole("button", { name: /View details for/ })
    .map((card) => card.getAttribute("aria-label")!.replace("View details for ", ""));
}

describe("Found items page (FoundItemsBrowser)", () => {
  it("loads every public item once and shows them newest first", async () => {
    const { calls } = installFakeApi({
      "GET /api/public/items": () => ok(publicItems, { total: publicItems.length }),
    });
    render(<FoundItemsBrowser initialCategory="" initialQuery="" />);

    expect(screen.getByText("Loading found items…")).toBeInTheDocument();
    expect(await screen.findByText("4 items waiting to be found")).toBeInTheDocument();
    expect(cardNames()).toEqual([
      "Silver wristwatch",
      "Olive canvas backpack",
      "Wireless headphones",
      "Brown leather wallet",
    ]);
    expect(calls).toHaveLength(1);
  });

  it("applies the ?q= and ?category= from the URL on first render", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    render(<FoundItemsBrowser initialCategory="Bags & wallets" initialQuery="" />);
    expect(await screen.findByText("2 items in Bags & wallets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bags & wallets" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores an unknown category from the URL and falls back to 'All items'", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    render(<FoundItemsBrowser initialCategory="Spaceships" initialQuery="" />);
    expect(await screen.findByText("4 items waiting to be found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All items" })).toHaveAttribute("aria-pressed", "true");
  });

  it("search filters by name, location, category and description without a new request", async () => {
    const { calls } = installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    render(<FoundItemsBrowser initialCategory="" initialQuery="" />);
    await screen.findByText("4 items waiting to be found");
    const user = userEvent.setup();
    const search = screen.getByRole("textbox", { name: "Search by item or location" });

    await user.type(search, "library");
    expect(cardNames()).toEqual(["Wireless headphones"]);

    await user.clear(search);
    await user.type(search, "accessories");
    expect(cardNames()).toEqual(["Silver wristwatch"]);

    await user.clear(search);
    await user.type(search, "daypack");
    expect(cardNames()).toEqual(["Olive canvas backpack"]);
    expect(calls).toHaveLength(1);
  });

  it("category chips and the sort select work together", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    render(<FoundItemsBrowser initialCategory="" initialQuery="" />);
    await screen.findByText("4 items waiting to be found");
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Bags & wallets" }));
    expect(cardNames()).toEqual(["Olive canvas backpack", "Brown leather wallet"]);

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort found items" }), "name");
    expect(cardNames()).toEqual(["Brown leather wallet", "Olive canvas backpack"]);

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort found items" }), "oldest");
    expect(cardNames()).toEqual(["Brown leather wallet", "Olive canvas backpack"]);
  });

  it("shows the empty state and 'Clear search & filters' resets everything", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    render(<FoundItemsBrowser initialCategory="" initialQuery="zzz-nothing" />);
    expect(await screen.findByRole("heading", { name: "No finds just yet" })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Clear search & filters" }));
    expect(screen.getByText("4 items waiting to be found")).toBeInTheDocument();
  });

  it("a reunited item opens without the claim button", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    render(<FoundItemsBrowser initialCategory="" initialQuery="" />);
    await screen.findByText("4 items waiting to be found");
    await userEvent.setup().click(screen.getByRole("button", { name: "View details for Brown leather wallet" }));
    const dialog = screen.getByRole("dialog", { name: "Brown leather wallet details" });
    expect(within(dialog).getByRole("status")).toHaveTextContent("already been reunited");
    expect(within(dialog).queryByRole("button", { name: /This is mine/ })).not.toBeInTheDocument();
  });

  it("shows the error state with a working retry", async () => {
    installFakeApi({
      "GET /api/public/items": () => new Response("<html>", { status: 502 }),
    });
    render(<FoundItemsBrowser initialCategory="" initialQuery="" />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not load found items");
    expect(alert).toHaveTextContent("The service returned an invalid response.");

    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    await userEvent.setup().click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("4 items waiting to be found")).toBeInTheDocument();
  });
});
