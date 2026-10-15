import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { AdminClaims } from "@/components/admin/admin-claims";
import { AdminDataProvider } from "@/components/admin/admin-data-provider";
import { AdminFoundItems } from "@/components/admin/admin-found-items";
import { AdminOverview } from "@/components/admin/admin-overview";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  adminClaims,
  adminItems,
  adminRoutes,
  apiError,
  installFakeApi,
  ok,
} from "../helpers/fake-api";

function renderAdmin(page: ReactNode) {
  return render(
    <AdminAuthGate>
      <AdminDataProvider>
        <AdminShell>{page}</AdminShell>
      </AdminDataProvider>
    </AdminAuthGate>,
  );
}

describe("Admin workspace: loading and shell", () => {
  it("loads items, claims and stats together after the session check", async () => {
    const { calls } = installFakeApi(adminRoutes());
    renderAdmin(<AdminOverview />);
    expect(await screen.findByRole("heading", { name: "A little closer to found." })).toBeInTheDocument();
    expect(calls.map((call) => call.url).sort()).toEqual([
      "/api/admin/auth/me",
      "/api/admin/claims",
      "/api/admin/items",
      "/api/admin/stats",
    ]);
  });

  it("shows the signed-in email, a Sign out button and the pending-claims badge", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminOverview />);
    expect(await screen.findByText("admin@lostnfind.local")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    const claimsLink = screen.getByRole("link", { name: /Claims/ });
    expect(within(claimsLink).getByText("2")).toBeInTheDocument();
  });

  it("shows a retry screen when the workspace data fails to load", async () => {
    installFakeApi(adminRoutes({ "GET /api/admin/items": () => apiError(502, "The admin API is unavailable.") }));
    renderAdmin(<AdminOverview />);
    expect(await screen.findByRole("alert")).toHaveTextContent("The admin API is unavailable.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("Overview page (AdminOverview)", () => {
  it("shows the totals from /api/admin/stats and queues what is waiting for a decision", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminOverview />);
    const summary = await screen.findByRole("region", { name: "Dashboard summary" });
    expect(summary).toHaveTextContent("Total Found Items5");
    expect(summary).toHaveTextContent("Pending Claims2");
    expect(summary).toHaveTextContent("Approved Claims1");
    expect(summary).toHaveTextContent("Items Returned1");

    const reports = screen.getByRole("region", { name: "Reports awaiting review" });
    expect(within(reports).getAllByRole("listitem")).toHaveLength(1);
    expect(within(reports).getByText("Cream scarf with fringe")).toBeInTheDocument();
    expect(within(reports).getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(within(reports).getByRole("button", { name: "Reject" })).toBeInTheDocument();

    const claims = screen.getByRole("region", { name: "Claims awaiting a decision" });
    expect(within(claims).getAllByRole("listitem")).toHaveLength(2);
    expect(within(claims).getByText("Robin Harper")).toBeInTheDocument();
    expect(within(claims).getByText("Devon Price")).toBeInTheDocument();
    expect(within(claims).queryByText("Emery Clark")).not.toBeInTheDocument();
  });

  it("approves a queued report from the overview after confirming", async () => {
    const scarf = adminItems.find((item) => item.id === "item-scarf")!;
    const { calls } = installFakeApi(
      adminRoutes({
        "PATCH /api/admin/items/item-scarf/status": () => ok({ ...scarf, reviewStatus: "Approved" }),
      }),
    );
    renderAdmin(<AdminOverview />);
    const reports = await screen.findByRole("region", { name: "Reports awaiting review" });
    const user = userEvent.setup();
    await user.click(within(reports).getByRole("button", { name: "Approve" }));
    await user.click(within(screen.getByRole("dialog", { name: "Approve this report?" })).getByRole("button", { name: "Approve report" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Cream scarf with fringe marked approved.");
    const patch = calls.find((call) => call.method === "PATCH")!;
    expect(patch.url).toBe("/api/admin/items/item-scarf/status");
    expect(within(screen.getByRole("region", { name: "Reports awaiting review" })).queryByRole("listitem")).not.toBeInTheDocument();
  });
});

describe("Found Items page (AdminFoundItems)", () => {
  it("lists every report with the reporter line and the right buttons per status", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminFoundItems />);
    expect(await screen.findByText("5 results from the LostNFind API")).toBeInTheDocument();
    expect(screen.getByText("Reported by Chris Taylor")).toBeInTheDocument();
    // sections read in decision order
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Pending review",
      "Approved",
      "Rejected",
      "Returned",
    ]);

    const rowOf = (name: string) => screen.getByText(name).closest("li")!;
    expect(within(rowOf("Cream scarf with fringe")).getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(within(rowOf("Cream scarf with fringe")).getByRole("button", { name: "Reject" })).toBeInTheDocument();
    expect(within(rowOf("Canvas tote bag")).getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(within(rowOf("Silver wristwatch")).getByRole("button", { name: "Mark returned" })).toBeInTheDocument();
    expect(within(rowOf("Brown leather wallet")).queryByRole("button", { name: /Approve|Reject|Mark returned/ })).not.toBeInTheDocument();
  });

  it("search and the two selects filter the table client-side", async () => {
    const { calls } = installFakeApi(adminRoutes());
    renderAdmin(<AdminFoundItems />);
    await screen.findByText("5 results from the LostNFind API");
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox", { name: "Search found item reports" }), "morgan");
    expect(screen.getByText("2 results from the LostNFind API")).toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Search found item reports" }));

    await user.click(within(screen.getByRole("group", { name: "Filter found items by review status" })).getByRole("button", { name: "Pending review" }));
    expect(screen.getByText("1 result from the LostNFind API")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter found items by category" }), "Electronics");
    expect(screen.getByRole("heading", { name: "No reports match these filters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("5 results from the LostNFind API")).toBeInTheDocument();
    expect(calls.filter((call) => call.url.startsWith("/api/admin/items"))).toHaveLength(1);
  });

  it("View opens the report with reporter contact", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminFoundItems />);
    await screen.findByText("5 results from the LostNFind API");
    await userEvent.setup().click(screen.getByRole("button", { name: "View Cream scarf with fringe details" }));
    const dialog = screen.getByRole("dialog", { name: "Cream scarf with fringe report details" });
    expect(within(dialog).getByText("chris@example.com")).toHaveAttribute("href", "mailto:chris@example.com");
    expect(within(dialog).getByText("No image provided")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Approve report" })).toBeInTheDocument();
  });

  it("Approve → confirm → PATCH /status, then the row and notice update", async () => {
    const scarf = adminItems.find((item) => item.id === "item-scarf")!;
    const { calls } = installFakeApi(
      adminRoutes({
        "PATCH /api/admin/items/item-scarf/status": () => ok({ ...scarf, reviewStatus: "Approved" }),
      }),
    );
    renderAdmin(<AdminFoundItems />);
    await screen.findByText("5 results from the LostNFind API");
    const user = userEvent.setup();

    const row = screen.getByText("Cream scarf with fringe").closest("li")!;
    await user.click(within(row).getByRole("button", { name: "Approve" }));
    const dialog = screen.getByRole("dialog", { name: "Approve this report?" });
    await user.click(within(dialog).getByRole("button", { name: "Approve report" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Cream scarf with fringe marked approved.");
    const patch = calls.find((call) => call.method === "PATCH")!;
    expect(patch.url).toBe("/api/admin/items/item-scarf/status");
    expect(JSON.parse(patch.body as string)).toEqual({ reviewStatus: "Approved" });
    expect(within(screen.getByText("Cream scarf with fringe").closest("li")!).getByRole("button", { name: "Mark returned" })).toBeInTheDocument();
    // overview refreshed after the change
    expect(calls.filter((call) => call.url === "/api/admin/stats")).toHaveLength(2);
  });

  it("Mark returned → POST /return, then claims and overview are refetched", async () => {
    const watch = adminItems[0];
    const { calls } = installFakeApi(
      adminRoutes({
        "POST /api/admin/items/item-watch/return": () =>
          ok({ ...watch, reviewStatus: "Returned", status: "Reunited" }),
      }),
    );
    renderAdmin(<AdminFoundItems />);
    await screen.findByText("5 results from the LostNFind API");
    const user = userEvent.setup();
    await user.click(within(screen.getByText("Silver wristwatch").closest("li")!).getByRole("button", { name: "Mark returned" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark returned report" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Silver wristwatch marked returned.");
    expect(calls.some((call) => call.method === "POST" && call.url === "/api/admin/items/item-watch/return")).toBe(true);
    expect(calls.filter((call) => call.url === "/api/admin/claims")).toHaveLength(2);
  });

  it("a 409 from the backend keeps the dialog open and shows the message in the shell", async () => {
    installFakeApi(
      adminRoutes({
        "PATCH /api/admin/items/item-tote/status": () =>
          apiError(409, "That status change is not allowed."),
      }),
    );
    renderAdmin(<AdminFoundItems />);
    await screen.findByText("5 results from the LostNFind API");
    const user = userEvent.setup();
    await user.click(within(screen.getByText("Canvas tote bag").closest("li")!).getByRole("button", { name: "Approve" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Approve report" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That status change is not allowed.");
    expect(screen.getByRole("dialog", { name: "Approve this report?" })).toBeInTheDocument();
  });
});

describe("Claims page (AdminClaims + AdminClaimDetails)", () => {
  it("lists claims as comparison slips under their item, filters by tab and search", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminClaims />);
    expect(await screen.findByText(/3 requests from the LostNFind API/)).toBeInTheDocument();
    // the finder's description sits next to what the claimant says
    const slip = screen.getByText("Robin Harper").closest("li")!;
    expect(within(slip).getByText("A silver-tone wristwatch with a dark blue face.")).toBeInTheDocument();
    expect(within(slip).getByText("A silver watch with a navy dial.")).toBeInTheDocument();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /^Approved$/ }));
    expect(screen.getByText("1 request from the LostNFind API")).toBeInTheDocument();
    expect(screen.getByText("Emery Clark")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^All$/ }));
    await user.type(screen.getByRole("textbox", { name: "Search claim requests" }), "devon@");
    expect(screen.getByText("1 request from the LostNFind API")).toBeInTheDocument();
    expect(screen.getByText("Devon Price")).toBeInTheDocument();
  });

  it("Review opens the claim with contact, proof and the supporting image through the admin proxy", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminClaims />);
    await screen.findByText(/3 requests from the LostNFind API/);
    const user = userEvent.setup();
    await user.click(within(screen.getByText("Robin Harper").closest("li")!).getByRole("button", { name: "Review" }));

    const dialog = screen.getByRole("dialog", { name: "Claim from Robin Harper" });
    expect(within(dialog).getByText("robin@example.com")).toHaveAttribute("href", "mailto:robin@example.com");
    expect(within(dialog).getByText("The initials R.H. are engraved on the inside of the clasp.")).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: "Claimant-provided ownership evidence" })).toHaveAttribute(
      "src",
      "/api/admin/files/claims/proof-1.jpg",
    );
    expect(within(dialog).getByRole("button", { name: "Approve claim" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Reject claim" })).toBeInTheDocument();
  });

  it("Approve claim → confirm → PATCH /status, claims list refreshed", async () => {
    const { calls } = installFakeApi(
      adminRoutes({
        "PATCH /api/admin/claims/claim-watch-01/status": () => ok({ ...adminClaims[0], status: "Approved" }),
      }),
    );
    renderAdmin(<AdminClaims />);
    await screen.findByText(/3 requests from the LostNFind API/);
    const user = userEvent.setup();
    await user.click(within(screen.getByText("Robin Harper").closest("li")!).getByRole("button", { name: "Review" }));
    await user.click(screen.getByRole("button", { name: "Approve claim" }));
    const confirm = screen.getByRole("dialog", { name: "Approve this claim?" });
    await user.click(within(confirm).getByRole("button", { name: "Approve claim" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Claim for Robin Harper marked approved.");
    const patch = calls.find((call) => call.method === "PATCH")!;
    expect(patch.url).toBe("/api/admin/claims/claim-watch-01/status");
    expect(JSON.parse(patch.body as string)).toEqual({ status: "Approved" });
  });

  it("an approved claim on a non-returned item offers 'Mark item returned'", async () => {
    const returnedWallet = { ...adminItems[2], reviewStatus: "Approved" as const, status: "Waiting for owner" as const };
    const items = adminItems.map((item) => (item.id === "item-wallet" ? returnedWallet : item));
    const { calls } = installFakeApi(
      adminRoutes({
        "GET /api/admin/items": () => ok(items, { total: items.length }),
        "POST /api/admin/items/item-wallet/return": () =>
          ok({ ...returnedWallet, reviewStatus: "Returned", status: "Reunited" }),
      }),
    );
    renderAdmin(<AdminClaims />);
    await screen.findByText(/3 requests from the LostNFind API/);
    const user = userEvent.setup();
    await user.click(within(screen.getByText("Emery Clark").closest("li")!).getByRole("button", { name: "Review" }));
    await user.click(screen.getByRole("button", { name: "Mark item returned" }));
    await user.click(within(screen.getByRole("dialog", { name: "Mark the item as returned?" })).getByRole("button", { name: "Mark item returned" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Brown leather wallet marked returned.");
    expect(calls.some((call) => call.url === "/api/admin/items/item-wallet/return")).toBe(true);
  });
});
