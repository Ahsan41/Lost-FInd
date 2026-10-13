import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImageUploader } from "@/components/ui/image-uploader";

describe("ImageUploader", () => {
  it("accepts a JPG/PNG/WEBP under 8 MB and shows the preview", async () => {
    const onChange = vi.fn();
    render(<ImageUploader file={null} onChange={onChange} />);
    const file = new File(["img"], "photo.webp", { type: "image/webp" });
    await userEvent.setup().upload(screen.getByLabelText("Item image"), file);
    expect(onChange).toHaveBeenCalledWith(file);
    expect(screen.getByRole("button", { name: "Replace image" })).toBeInTheDocument();
  });

  it("rejects a non-image with the same sentence the backend uses", async () => {
    const onChange = vi.fn();
    render(<ImageUploader file={null} onChange={onChange} />);
    const file = new File(["%PDF"], "scan.pdf", { type: "application/pdf" });
    await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText("Item image"), file);
    expect(screen.getByRole("alert")).toHaveTextContent("Choose an image file to continue.");
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("rejects files over 8 MB", async () => {
    const onChange = vi.fn();
    render(<ImageUploader file={null} onChange={onChange} />);
    const big = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" });
    await userEvent.setup().upload(screen.getByLabelText("Item image"), big);
    expect(screen.getByRole("alert")).toHaveTextContent("Images must be smaller than 8 MB.");
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("Remove clears the selection", async () => {
    const onChange = vi.fn();
    render(<ImageUploader file={null} onChange={onChange} />);
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText("Item image"), new File(["x"], "a.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("button", { name: "Choose image" })).toBeInTheDocument();
  });
});
