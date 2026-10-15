import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import AppShell from "@/components/app-shell";
import { HomeExperience } from "@/components/routes/home-experience";
import { apiError, installFakeApi, networkDown, ok, publicItems } from "../helpers/fake-api";

function renderHome() {
  return render(
    <AppShell>
      <HomeExperience />
    </AppShell>,
  );
}

describe("Home page (HomeExperience)", () => {
  it("shows a loading state, then the 3 most recent found items from the API", async () => {
    const { calls } = installFakeApi({
      "GET /api/public/items": () => ok(publicItems, { total: publicItems.length }),
    });
    renderHome();

    expect(screen.getByRole("status", { name: "Loading recent items" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Silver wristwatch" })).toBeInTheDocument();

    const cards = screen.getAllByRole("button", { name: /View details for/ });
    expect(cards.map((card) => card.getAttribute("aria-label"))).toEqual([
      "View details for Silver wristwatch",
      "View details for Olive canvas backpack",
      "View details for Wireless headphones",
    ]);
    expect(calls[0]).toMatchObject({ method: "GET", url: "/api/public/items?limit=100" });
  });

  it("renders a placeholder when an item has no image", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    renderHome();
    const card = await screen.findByRole("button", { name: "View details for Olive canvas backpack" });
    expect(within(card).queryByRole("img")).not.toBeInTheDocument();
    expect(card.querySelector(".item-image-placeholder")).toBeInTheDocument();
  });

  it("hero search submits to /found-items with q, and category chips link with the label", async () => {
    installFakeApi({ "GET /api/public/items": () => ok([], { total: 0 }) });
    renderHome();
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/found-items");
    expect(within(form).getByRole("textbox")).toHaveAttribute("name", "q");

    expect(screen.getByRole("link", { name: /Bags & wallets/ })).toHaveAttribute(
      "href",
      `/found-items?category=${encodeURIComponent("Bags & wallets")}`,
    );
    expect(await screen.findByText("No approved found items yet.")).toBeInTheDocument();
  });

  it("opening a card shows the details modal; 'This is mine' opens the claim form", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    renderHome();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "View details for Silver wristwatch" }));
    const dialog = screen.getByRole("dialog", { name: "Silver wristwatch details" });
    expect(within(dialog).getByText("Riverside Park, near the east entrance")).toBeInTheDocument();
    expect(within(dialog).getByText("Oct 8, 2026")).toBeInTheDocument();

    const claimButton = within(dialog).getByRole("button", { name: /This is mine/ });
    expect(claimButton).toBeDisabled();
    for (const box of within(dialog).getAllByRole("checkbox")) await user.click(box);
    expect(claimButton).toBeEnabled();
    await user.click(claimButton);
    expect(screen.getByRole("dialog", { name: "Claim Silver wristwatch" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Claim this item" })).toBeInTheDocument();
  });

  it("'Report an item' in the header opens the report modal", async () => {
    installFakeApi({ "GET /api/public/items": () => ok([], { total: 0 }) });
    renderHome();
    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: /Report an item/ })[0]);
    expect(screen.getByRole("dialog", { name: "Report a found item" })).toBeInTheDocument();
  });

  it("shows the API error with a retry button, and retries", async () => {
    networkDown();
    renderHome();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not connect to the service. Please try again.");

    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 4 }) });
    await userEvent.setup().click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Silver wristwatch" })).toBeInTheDocument();
  });

  it("shows the backend's message when the service returns an error envelope", async () => {
    installFakeApi({
      "GET /api/public/items": () => apiError(502, "The service is unavailable. Try again."),
    });
    renderHome();
    expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable. Try again.");
  });

  it("refuses a response that is not the FoundItem shape", async () => {
    installFakeApi({
      "GET /api/public/items": () => ok([{ id: "x", name: "Broken" }], { total: 1 }),
    });
    renderHome();
    expect(await screen.findByRole("alert")).toHaveTextContent("The service returned an invalid response.");
  });

  it("warns when the API has more items than it returned", async () => {
    installFakeApi({ "GET /api/public/items": () => ok(publicItems, { total: 500 }) });
    renderHome();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("did not return all available items"),
    );
  });
});
