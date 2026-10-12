"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { MAX_IMAGE_BYTES } from "@/lib/public-api";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploaderProps {
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
}

export function ImageUploader({
  file,
  onChange,
  label = "Item image",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function selectFile(selected: File | undefined) {
    setError("");
    if (!selected) return;
    if (!acceptedImageTypes.includes(selected.type)) {
      clearFile();
      setError("Choose an image file to continue.");
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      clearFile();
      setError("Images must be smaller than 8 MB.");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(selected);
    previewUrlRef.current = objectUrl;
    setPreview(objectUrl);
    onChange(selected);
  }

  function clearFile() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
    onChange(null);
  }

  function openPicker() {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="upload-area">
        <input
          ref={inputRef}
          aria-label={label}
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => selectFile(event.currentTarget.files?.[0])}
          type="file"
        />
        {preview ? (
          <>
            <Image
              alt={`Preview of ${file?.name ?? "selected image"}`}
              className="upload-preview-image"
              fill
              sizes="(max-width: 620px) 90vw, 580px"
              src={preview}
              unoptimized
            />
            <div className="upload-preview">
              <button
                className="button button-secondary button-small"
                onClick={openPicker}
                type="button"
              >
                Replace image
              </button>
              <button
                className="button button-secondary button-small"
                onClick={() => {
                  clearFile();
                  if (inputRef.current) inputRef.current.value = "";
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="upload-content">
            <span className="upload-icon"><Icon name="upload" /></span>
            <strong>Add a clear photo (optional)</strong>
            <span>JPG, PNG or WEBP · Up to 8 MB</span>
            <button
              className="button button-secondary button-small"
              onClick={openPicker}
              type="button"
            >
              Choose image
            </button>
          </div>
        )}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
