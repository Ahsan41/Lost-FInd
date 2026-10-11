"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { FoundItem } from "@/types/item";
import { isValidEmail, isValidPhone } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Field } from "@/components/ui/field";
import { ImageUploader } from "@/components/ui/image-uploader";

interface ClaimValues {
  name: string;
  email: string;
  phone: string;
  description: string;
  proof: string;
}

type ClaimErrors = Partial<Record<keyof ClaimValues, string>>;

interface ClaimItemFormProps {
  item: FoundItem;
  onCancel: () => void;
  onDone: () => void;
}

function validate(values: ClaimValues): ClaimErrors {
  const errors: ClaimErrors = {};
  if (!values.name.trim()) errors.name = "Enter your full name.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (!values.phone.trim()) errors.phone = "Enter a phone or WhatsApp number.";
  else if (!isValidPhone(values.phone)) errors.phone = "Enter a valid phone number.";
  if (!values.description.trim()) errors.description = "Describe the item you lost.";
  if (!values.proof.trim()) errors.proof = "Share a detail only the owner would know.";
  return errors;
}

export function ClaimItemForm({ item, onCancel, onDone }: ClaimItemFormProps) {
  const [values, setValues] = useState<ClaimValues>({
    name: "",
    email: "",
    phone: "",
    description: "",
    proof: "",
  });
  const [errors, setErrors] = useState<ClaimErrors>({});
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof ClaimValues>(key: K, value: ClaimValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="modal-content">
        <div className="success-state">
          <span className="success-icon"><Icon name="check-circle" /></span>
          <h3>Claim request ready</h3>
          <p>Your claim for <strong>{item.name}</strong> was submitted in this demo for review. No information was sent or saved.</p>
          <button className="button button-primary" onClick={onDone} type="button">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-content">
      <div className="modal-heading">
        <p className="eyebrow"><span className="eyebrow-dot" />Let’s get it back to you</p>
        <h2 className="modal-title">Claim this item</h2>
        <p className="modal-description">A few details help us make sure it finds the right person.</p>
      </div>
      <div className="claim-item-summary">
        <div className="claim-thumb-wrap">
          <Image alt="" className="claim-thumb" fill sizes="54px" src={item.image} unoptimized />
        </div>
        <div className="claim-item-summary-copy">
          <strong>{item.name}</strong>
          <span>{item.category} · {item.location}</span>
        </div>
      </div>
      <form className="form-stack" noValidate onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field error={errors.name} htmlFor="claim-name" label="Your full name" required>
            <input aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "claim-name-error" : undefined} autoComplete="name" className="field-input" id="claim-name" onChange={(event) => update("name", event.target.value)} placeholder="Full name" value={values.name} />
          </Field>
          <Field error={errors.email} htmlFor="claim-email" label="Email address" required>
            <input aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "claim-email-error" : undefined} autoComplete="email" className="field-input" id="claim-email" onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" type="email" value={values.email} />
          </Field>
        </div>
        <Field error={errors.phone} htmlFor="claim-phone" label="Phone or WhatsApp number" required>
          <input aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "claim-phone-error" : undefined} autoComplete="tel" className="field-input" id="claim-phone" onChange={(event) => update("phone", event.target.value)} placeholder="+1 555 012 3456" type="tel" value={values.phone} />
        </Field>
        <Field error={errors.description} htmlFor="claim-description" label="Describe the item you lost" required>
          <textarea aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "claim-description-error" : undefined} className="field-input" id="claim-description" onChange={(event) => update("description", event.target.value)} placeholder="Include details that help distinguish your item" value={values.description} />
        </Field>
        <Field error={errors.proof} htmlFor="claim-proof" label="What helps identify it as yours?" required>
          <textarea aria-invalid={Boolean(errors.proof)} aria-describedby={errors.proof ? "claim-proof-error" : undefined} className="field-input" id="claim-proof" onChange={(event) => update("proof", event.target.value)} placeholder="A mark, contents, serial detail, or anything not shown publicly" value={values.proof} />
        </Field>
        <ImageUploader file={image} label="Supporting image" onChange={setImage} />
        <div className="steps-note"><Icon name="shield" />Your claim details stay private and would only be used to verify ownership.</div>
        <div className="form-actions">
          <button className="button button-secondary" onClick={onCancel} type="button">Cancel</button>
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? <><span className="loading-indicator" />Submitting…</> : <>Submit claim <Icon name="arrow-right" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
