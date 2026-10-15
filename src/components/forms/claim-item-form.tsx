"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import type { FoundItem } from "@/types/item";
import { isValidEmail, isValidPhone, referenceNumber } from "@/lib/format";
import {
  getApiFieldErrors,
  getPublicApiErrorMessage,
  publicApi,
  type ClaimInput,
} from "@/lib/public-api";
import { Icon } from "@/components/ui/icon";
import { describedBy, Field } from "@/components/ui/field";
import { ImageUploader } from "@/components/ui/image-uploader";

type ClaimValues = ClaimInput;
const claimFields = ["name", "email", "phone", "description", "proof"] as const satisfies readonly (keyof ClaimValues)[];
type ClaimErrors = Partial<Record<(typeof claimFields)[number], string>>;

const hints = {
  description: "Describe it in your own words before you compare with the listing.",
  proof: "Something that is not visible in the photo or the description: contents, an engraving, a repair, a serial number.",
} as const;

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
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);

  function update<K extends keyof ClaimValues>(key: K, value: ClaimValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await publicApi.submitClaim(item.id, values, image);
      setSubmitted(true);
    } catch (error) {
      setErrors(getApiFieldErrors(error, claimFields));
      setSubmitError(getPublicApiErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="dialog-content">
        <div className="success-state">
          <span className="success-glyph"><Icon name="check" /></span>
          <h3>Claim request sent</h3>
          <p>Your claim for <strong>{item.name}</strong> was sent for review. We’ll contact you using the details you provided.</p>
          <div className="success-next">
            <div>
              <strong>What happens next</strong>
              The administrator compares your answer with details the finder kept private. If it matches,
              you and the finder each receive the other’s contact details to arrange the hand-over.
            </div>
          </div>
          <button className="button button-primary" onClick={onDone} type="button">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-content">
      <header className="dialog-head">
        <p className="kicker kicker-accent">Ownership claim</p>
        <h2 className="dialog-title">Claim this item</h2>
        <p className="dialog-lede">Answer a few questions so the administrator can confirm it is yours before anyone is contacted.</p>
      </header>

      <div className="claim-subject">
        <div className="claim-subject-media">
          {item.image && <Image alt="" fill sizes="56px" src={item.image} unoptimized />}
        </div>
        <div className="claim-subject-copy">
          <small>You are claiming · {referenceNumber(item.id)}</small>
          <strong>{item.name}</strong>
          <span>{item.category} · {item.location}</span>
        </div>
      </div>

      <form className="form" noValidate onSubmit={handleSubmit}>
        {submitError && <p className="form-error" role="alert"><Icon name="info" />{submitError}</p>}

        <fieldset className="form-section">
          <legend className="form-section-title"><span className="form-section-index">01</span>Your details</legend>
          <div className="form-row">
            <Field error={errors.name} htmlFor="claim-name" label="Your full name" required>
              <input
                aria-describedby={describedBy("claim-name", { error: errors.name })}
                aria-invalid={Boolean(errors.name)}
                autoComplete="name"
                className="field-input"
                id="claim-name"
                onChange={(event) => update("name", event.target.value)}
                placeholder="Full name"
                value={values.name}
              />
            </Field>
            <Field error={errors.email} htmlFor="claim-email" label="Email address" required>
              <input
                aria-describedby={describedBy("claim-email", { error: errors.email })}
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                className="field-input"
                id="claim-email"
                onChange={(event) => update("email", event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={values.email}
              />
            </Field>
          </div>
          <Field error={errors.phone} htmlFor="claim-phone" label="Phone or WhatsApp number" required>
            <input
              aria-describedby={describedBy("claim-phone", { error: errors.phone })}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              className="field-input"
              id="claim-phone"
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+92 300 1234567"
              type="tel"
              value={values.phone}
            />
          </Field>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section-title"><span className="form-section-index">02</span>What you lost</legend>
          <Field error={errors.description} hint={hints.description} htmlFor="claim-description" label="Describe the item you lost" required>
            <textarea
              aria-describedby={describedBy("claim-description", { error: errors.description, hint: hints.description })}
              aria-invalid={Boolean(errors.description)}
              className="field-input"
              id="claim-description"
              onChange={(event) => update("description", event.target.value)}
              placeholder="Colour, brand, size, where and roughly when you lost it"
              value={values.description}
            />
          </Field>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section-title"><span className="form-section-index">03</span>Proof it is yours</legend>
          <Field error={errors.proof} hint={hints.proof} htmlFor="claim-proof" label="What helps identify it as yours?" required>
            <textarea
              aria-describedby={describedBy("claim-proof", { error: errors.proof, hint: hints.proof })}
              aria-invalid={Boolean(errors.proof)}
              className="field-input"
              id="claim-proof"
              onChange={(event) => update("proof", event.target.value)}
              placeholder="A mark, the contents, a serial detail, or anything not shown publicly"
              value={values.proof}
            />
          </Field>
          <ImageUploader
            file={image}
            hint="A receipt, an older photo of you with the item, or a close-up of a distinguishing mark."
            label="Supporting image"
            onChange={setImage}
          />
          <p className="privacy-note">
            <Icon name="lock" />
            Everything in this claim is private. It is only used by the administrator to verify ownership.
          </p>
        </fieldset>

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
