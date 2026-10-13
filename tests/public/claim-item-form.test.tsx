import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClaimItemForm } from "@/components/forms/claim-item-form";
import { apiError, installFakeApi, publicItems } from "../helpers/fake-api";

const watch = publicItems[0];

function created(): Response {
  return new Response(JSON.stringify({ data: { id: "claim-new", status: "Pending" } }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

async function fillValidClaim(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Your full name/), "Robin Harper");
  await user.type(screen.getByLabelText(/Email address/), "robin@example.com");
  await user.type(screen.getByLabelText(/Phone or WhatsApp number/), "+1 202 555 0121");
  await user.type(screen.getByLabelText(/Describe the item you lost/), "Silver watch with a navy dial");
  await user.type(screen.getByLabelText(/What helps identify it as yours/), "Initials R.H. inside the clasp");
}

describe("Claim modal (ClaimItemForm)", () => {
  it("shows the item summary and validates locally with the form's sentences", async () => {
    const { calls } = installFakeApi({});
    render(<ClaimItemForm item={watch} onCancel={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByText("Silver wristwatch")).toBeInTheDocument();
    expect(screen.getByText("Accessories · Riverside Park, near the east entrance")).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: /Submit claim/ }));
    expect(screen.getAllByRole("alert").map((alert) => alert.textContent)).toEqual([
      "Enter your full name.",
      "Enter your email address.",
      "Enter a phone or WhatsApp number.",
      "Describe the item you lost.",
      "Share a detail only the owner would know.",
    ]);
    expect(calls).toHaveLength(0);
  });

  it("posts the five fields and the supporting image to /api/public/items/:id/claims", async () => {
    const { calls } = installFakeApi({ "POST /api/public/items/item-watch/claims": created });
    const onDone = vi.fn();
    render(<ClaimItemForm item={watch} onCancel={vi.fn()} onDone={onDone} />);
    const user = userEvent.setup();
    await fillValidClaim(user);
    await user.upload(
      screen.getByLabelText("Supporting image"),
      new File(["proof"], "proof.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: /Submit claim/ }));

    expect(await screen.findByRole("heading", { name: "Claim request sent" })).toBeInTheDocument();
    expect(calls[0]).toMatchObject({ method: "POST", url: "/api/public/items/item-watch/claims" });
    const body = calls[0].body as FormData;
    expect(Object.fromEntries(body.entries())).toMatchObject({
      name: "Robin Harper",
      email: "robin@example.com",
      phone: "+1 202 555 0121",
      description: "Silver watch with a navy dial",
      proof: "Initials R.H. inside the clasp",
    });
    expect((body.get("supportingImage") as File).name).toBe("proof.jpg");

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onDone).toHaveBeenCalled();
  });

  it("works without an image: the supportingImage field is simply absent", async () => {
    const { calls } = installFakeApi({ "POST /api/public/items/item-watch/claims": created });
    render(<ClaimItemForm item={watch} onCancel={vi.fn()} onDone={vi.fn()} />);
    const user = userEvent.setup();
    await fillValidClaim(user);
    await user.click(screen.getByRole("button", { name: /Submit claim/ }));
    await screen.findByRole("heading", { name: "Claim request sent" });
    expect((calls[0].body as FormData).has("supportingImage")).toBe(false);
  });

  it("maps backend field errors onto the inputs", async () => {
    installFakeApi({
      "POST /api/public/items/item-watch/claims": () =>
        apiError(400, "Please check the highlighted fields.", {
          phone: "Enter a valid phone number.",
          proof: "Share a detail only the owner would know.",
        }),
    });
    render(<ClaimItemForm item={watch} onCancel={vi.fn()} onDone={vi.fn()} />);
    const user = userEvent.setup();
    await fillValidClaim(user);
    await user.click(screen.getByRole("button", { name: /Submit claim/ }));
    expect(await screen.findByText("Enter a valid phone number.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone or WhatsApp number/)).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the backend's 409 when the item was reunited meanwhile", async () => {
    installFakeApi({
      "POST /api/public/items/item-watch/claims": () =>
        apiError(409, "This item has already been reunited with its owner."),
    });
    render(<ClaimItemForm item={watch} onCancel={vi.fn()} onDone={vi.fn()} />);
    const user = userEvent.setup();
    await fillValidClaim(user);
    await user.click(screen.getByRole("button", { name: /Submit claim/ }));
    expect(await screen.findByText("This item has already been reunited with its owner.")).toBeInTheDocument();
  });

  it("Cancel calls onCancel without sending anything", async () => {
    const { calls } = installFakeApi({});
    const onCancel = vi.fn();
    render(<ClaimItemForm item={watch} onCancel={onCancel} onDone={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });
});
