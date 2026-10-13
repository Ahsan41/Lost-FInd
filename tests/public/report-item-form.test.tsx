import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReportItemForm } from "@/components/forms/report-item-form";
import { apiError, installFakeApi, networkDown, type RecordedCall } from "../helpers/fake-api";

const today = new Date().toISOString().slice(0, 10);

async function fillValidReport(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Item name/), "Blue water bottle");
  await user.selectOptions(screen.getByLabelText(/Category/), "Other");
  await user.type(screen.getByLabelText(/Description/), "Steel bottle with a dented lid");
  await user.type(screen.getByLabelText(/Found location/), "Central Station");
  fireEvent.change(screen.getByLabelText(/Date found/), { target: { value: "2026-10-09" } });
  await user.type(screen.getByLabelText(/Your full name/), "Pat Doe");
  await user.type(screen.getByLabelText(/Email address/), "pat@example.com");
  await user.type(screen.getByLabelText(/Phone number/), "+1 555 012 3456");
}

function formFields(call: RecordedCall): Record<string, FormDataEntryValue> {
  const body = call.body as FormData;
  return Object.fromEntries(body.entries());
}

describe("Report an item modal (ReportItemForm)", () => {
  it("validates locally with the form's sentences before calling the API", async () => {
    const { calls } = installFakeApi({});
    render(<ReportItemForm onCancel={vi.fn()} onDone={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Continue/ }));

    const alerts = screen.getAllByRole("alert").map((alert) => alert.textContent);
    expect(alerts).toEqual([
      "Add a name for the item.",
      "Choose a category.",
      "Add a few identifying details.",
      "Add where it was found.",
      "Choose the date it was found.",
      "Enter your full name.",
      "Enter your email address.",
      "Enter a phone number.",
    ]);
    expect(calls).toHaveLength(0);
  });

  it("rejects a future date, a bad email, a bad phone and a bad WhatsApp number locally", async () => {
    installFakeApi({});
    render(<ReportItemForm onCancel={vi.fn()} onDone={vi.fn()} />);
    const user = userEvent.setup();
    await fillValidReport(user);
    fireEvent.change(screen.getByLabelText(/Date found/), { target: { value: "2999-01-01" } });
    await user.clear(screen.getByLabelText(/Email address/));
    await user.type(screen.getByLabelText(/Email address/), "pat@nowhere");
    await user.clear(screen.getByLabelText(/Phone number/));
    await user.type(screen.getByLabelText(/Phone number/), "12");
    await user.type(screen.getByLabelText(/WhatsApp number/), "abc");
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getAllByRole("alert").map((alert) => alert.textContent)).toEqual([
      "The date found cannot be in the future.",
      "Enter a valid email address.",
      "Enter a valid phone number.",
      "Enter a valid WhatsApp number.",
    ]);
  });

  it("the date input cannot be set after today", () => {
    installFakeApi({});
    render(<ReportItemForm onCancel={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByLabelText(/Date found/)).toHaveAttribute("max", today);
  });

  it("sends every field plus the image as multipart to /api/public/items and shows the success panel", async () => {
    const { calls } = installFakeApi({
      "POST /api/public/items": () => json201({ id: "item-new", name: "Blue water bottle" }),
    });
    const onDone = vi.fn();
    render(<ReportItemForm onCancel={vi.fn()} onDone={onDone} />);
    const user = userEvent.setup();
    await fillValidReport(user);
    await user.type(screen.getByLabelText(/WhatsApp number/), "+44 7700 900123");
    const file = new File(["img"], "bottle.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Item image"), file);
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(await screen.findByRole("heading", { name: "Thanks for looking out" })).toBeInTheDocument();
    expect(screen.getByText(/after an administrator approves it/)).toBeInTheDocument();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "POST", url: "/api/public/items" });
    expect(calls[0].body).toBeInstanceOf(FormData);
    const fields = formFields(calls[0]);
    expect(fields).toMatchObject({
      name: "Blue water bottle",
      category: "Other",
      description: "Steel bottle with a dented lid",
      location: "Central Station",
      foundDate: "2026-10-09",
      reporterName: "Pat Doe",
      email: "pat@example.com",
      phone: "+1 555 012 3456",
      whatsapp: "+44 7700 900123",
    });
    expect((fields.image as File).name).toBe("bottle.png");
    // the browser sets the multipart boundary itself
    expect(calls[0].headers["content-type"]).toBeUndefined();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows server-side field errors inline using the backend's sentences", async () => {
    installFakeApi({
      "POST /api/public/items": () =>
        apiError(400, "Please check the highlighted fields.", {
          email: "Enter a valid email address.",
          image: "Images must be smaller than 8 MB.",
        }),
    });
    render(<ReportItemForm onCancel={vi.fn()} onDone={vi.fn()} />);
    const user = userEvent.setup();
    await fillValidReport(user);
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(await screen.findByText("Please check the highlighted fields.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("heading", { name: "Thanks for looking out" })).not.toBeInTheDocument();
  });

  it("shows a connection error and lets the person try again", async () => {
    networkDown();
    render(<ReportItemForm onCancel={vi.fn()} onDone={vi.fn()} />);
    const user = userEvent.setup();
    await fillValidReport(user);
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    expect(await screen.findByText("Could not connect to the service. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/ })).toBeEnabled();
  });

  it("disables the submit button while sending and ignores double clicks", async () => {
    let release!: () => void;
    const pending = new Promise<Response>((resolve) => {
      release = () => resolve(json201({ id: "item-new" }));
    });
    const { calls } = installFakeApi({ "POST /api/public/items": () => pending });
    render(<ReportItemForm onCancel={vi.fn()} onDone={vi.fn()} />);
    const user = userEvent.setup();
    await fillValidReport(user);
    const button = screen.getByRole("button", { name: /Continue/ });
    await user.click(button);
    expect(screen.getByRole("button", { name: /Sending report/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Sending report/ }));
    release();
    await screen.findByRole("heading", { name: "Thanks for looking out" });
    expect(calls).toHaveLength(1);
  });
});

function json201(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
