import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminAuthGate, useAdminAuth } from "@/components/admin/admin-auth-gate";
import { adminUser, apiError, installFakeApi, networkDown, ok } from "../helpers/fake-api";

function WhoAmI() {
  const { user, signOut } = useAdminAuth();
  return (
    <div>
      <p>Signed in as {user.email}</p>
      <button onClick={() => void signOut()} type="button">Sign out</button>
    </div>
  );
}

function renderGate() {
  return render(
    <AdminAuthGate>
      <WhoAmI />
    </AdminAuthGate>,
  );
}

describe("Admin login page and route guard (AdminAuthGate)", () => {
  it("checks the session first and renders the workspace for a signed-in admin", async () => {
    const { calls } = installFakeApi({ "GET /api/admin/auth/me": () => ok(adminUser) });
    renderGate();
    expect(screen.getByRole("status")).toHaveTextContent("Checking administrator session…");
    expect(await screen.findByText("Signed in as admin@lostnfind.local")).toBeInTheDocument();
    expect(calls[0]).toMatchObject({ method: "GET", url: "/api/admin/auth/me" });
  });

  it("shows the login form when there is no session (401)", async () => {
    installFakeApi({ "GET /api/admin/auth/me": () => apiError(401, "Sign in to continue.") });
    renderGate();
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("signs in with email + password as JSON and enters the workspace", async () => {
    const { calls } = installFakeApi({
      "GET /api/admin/auth/me": () => apiError(401, "Sign in to continue."),
      "POST /api/admin/auth/login": () => ok({ user: adminUser }),
    });
    renderGate();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email address"), "admin@lostnfind.local");
    await user.type(screen.getByLabelText("Password"), "secret-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Signed in as admin@lostnfind.local")).toBeInTheDocument();
    const login = calls.find((call) => call.url === "/api/admin/auth/login")!;
    expect(login.method).toBe("POST");
    expect(login.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(login.body as string)).toEqual({
      email: "admin@lostnfind.local",
      password: "secret-password",
    });
  });

  it("shows the proxy's message on a wrong password and stays on the form", async () => {
    installFakeApi({
      "GET /api/admin/auth/me": () => apiError(401, "Sign in to continue."),
      "POST /api/admin/auth/login": () => apiError(401, "Email or password is incorrect."),
    });
    renderGate();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email address"), "admin@lostnfind.local");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("shows a retry screen when the session check itself fails", async () => {
    networkDown();
    renderGate();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not connect to the admin service. Try again.");

    installFakeApi({ "GET /api/admin/auth/me": () => ok(adminUser) });
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Signed in as admin@lostnfind.local")).toBeInTheDocument();
  });

  it("Sign out calls the logout route and returns to the login form", async () => {
    const { calls } = installFakeApi({
      "GET /api/admin/auth/me": () => ok(adminUser),
      "POST /api/admin/auth/logout": () => ok({ loggedOut: true }),
    });
    renderGate();
    await userEvent.setup().click(await screen.findByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(calls.at(-1)).toMatchObject({ method: "POST", url: "/api/admin/auth/logout" });
  });

  it("returns to the login form when any admin call later answers 401", async () => {
    installFakeApi({ "GET /api/admin/auth/me": () => ok(adminUser) });
    renderGate();
    await screen.findByText("Signed in as admin@lostnfind.local");
    window.dispatchEvent(new Event("admin-session-expired"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your session expired. Sign in again.");
  });
});
