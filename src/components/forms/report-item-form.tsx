"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { itemCategories } from "@/types/item";
import { formatDate, isValidEmail, isValidPhone } from "@/lib/format";
import {
  getApiFieldErrors,
  getPublicApiErrorMessage,
  publicApi,
  type ReportItemInput,
} from "@/lib/public-api";
import { Icon } from "@/components/ui/icon";
import { describedBy, Field } from "@/components/ui/field";
import { ImageUploader } from "@/components/ui/image-uploader";

interface ReportValues {
  name: string;
  category: string;
  description: string;
  location: string;
  foundDate: string;
  reporterName: string;
  email: string;
  phone: string;
  whatsapp: string;
}

type ReportErrors = Partial<Record<keyof ReportValues, string>>;

const reportFields = [
  "name",
  "category",
  "description",
  "location",
  "foundDate",
  "reporterName",
  "email",
  "phone",
  "whatsapp",
] as const satisfies readonly (keyof ReportValues)[];

const emptyValues: ReportValues = {
  name: "",
  category: "",
  description: "",
  location: "",
  foundDate: "",
  reporterName: "",
  email: "",
  phone: "",
  whatsapp: "",
};

const hints = {
  description: "Colour, brand, size, condition. Keep one identifying detail to yourself so claims can be checked against it.",
  location: "Be specific: building, floor, room, or a nearby landmark.",
} as const;

interface ReportItemFormProps {
  onCancel: () => void;
  onDone: () => void;
}

function validate(values: ReportValues): ReportErrors {
  const errors: ReportErrors = {};
  if (!values.name.trim()) errors.name = "Add a name for the item.";
  if (!itemCategories.some((category) => category === values.category)) {
    errors.category = "Choose a category.";
  }
  if (!values.description.trim()) errors.description = "Add a few identifying details.";
  if (!values.location.trim()) errors.location = "Add where it was found.";
  if (!values.foundDate) errors.foundDate = "Choose the date it was found.";
  else if (values.foundDate > new Date().toISOString().slice(0, 10)) {
    errors.foundDate = "The date found cannot be in the future.";
  }
  if (!values.reporterName.trim()) errors.reporterName = "Enter your full name.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (!values.phone.trim()) errors.phone = "Enter a phone number.";
  else if (!isValidPhone(values.phone)) errors.phone = "Enter a valid phone number.";
  if (values.whatsapp && !isValidPhone(values.whatsapp)) {
    errors.whatsapp = "Enter a valid WhatsApp number.";
  }
  return errors;
}

export function ReportItemForm({ onCancel, onDone }: ReportItemFormProps) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<ReportErrors>({});
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);
  const today = new Date().toISOString().slice(0, 10);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function changeImage(file: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setImagePreview(previewUrlRef.current);
    setImage(file);
  }

  const previewDate = /^\d{4}-\d{2}-\d{2}$/.test(values.foundDate) ? formatDate(values.foundDate) : null;

  function update<K extends keyof ReportValues>(key: K, value: ReportValues[K]) {
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

    const category = itemCategories.find((itemCategory) => itemCategory === values.category);
    if (!category) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await publicApi.submitFoundItem({ ...values, category } satisfies ReportItemInput, image);
      setSubmitted(true);
    } catch (error) {
      setErrors(getApiFieldErrors(error, reportFields));
      setSubmitError(getPublicApiErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="sheet-content">
        <div className="success-state">
          <span className="success-glyph"><Icon name="check" /></span>
          <h3>Thanks for looking out</h3>
          <p>Your report has been sent for review. It will appear in the public listings after an administrator approves it.</p>
          <div className="success-next">
            <div>
              <strong>What happens next</strong>
              Keep the item somewhere safe. If someone claims it and the administrator approves the claim,
              you will be contacted using the details you gave so you can hand it over.
            </div>
          </div>
          <button className="button button-primary" onClick={onDone} type="button">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-content">
      <header className="sheet-head">
        <p className="kicker kicker-accent">Found-property report</p>
        <h2 className="sheet-title">Report a found item</h2>
        <p className="sheet-lede">
          Describe what you found and where. An administrator reviews every report before it is listed.
          Your contact details are only used to arrange a hand-over and never appear publicly.
        </p>
      </header>

      <form className="form" noValidate onSubmit={handleSubmit}>
        {submitError && <p className="form-error" role="alert"><Icon name="info" />{submitError}</p>}

        <fieldset className="form-section">
          <legend className="form-section-title"><span className="form-section-index">01</span>The item</legend>
          <div className="form-row">
            <Field error={errors.name} htmlFor="report-name" label="Item name" required>
              <input
                aria-describedby={describedBy("report-name", { error: errors.name })}
                aria-invalid={Boolean(errors.name)}
                autoComplete="off"
                className="field-input"
                id="report-name"
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Black leather wallet"
                value={values.name}
              />
            </Field>
            <Field error={errors.category} htmlFor="report-category" label="Category" required>
              <select
                aria-describedby={describedBy("report-category", { error: errors.category })}
                aria-invalid={Boolean(errors.category)}
                className="field-input"
                id="report-category"
                onChange={(event) => update("category", event.target.value)}
                value={values.category}
              >
                <option value="">Choose a category</option>
                {itemCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
          </div>
          <Field error={errors.description} hint={hints.description} htmlFor="report-description" label="Description" required>
            <textarea
              aria-describedby={describedBy("report-description", { error: errors.description, hint: hints.description })}
              aria-invalid={Boolean(errors.description)}
              className="field-input"
              id="report-description"
              onChange={(event) => update("description", event.target.value)}
              placeholder="What it looks like and anything that would help the owner recognise it"
              value={values.description}
            />
          </Field>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section-title"><span className="form-section-index">02</span>Where and when</legend>
          <div className="form-row">
            <Field error={errors.location} hint={hints.location} htmlFor="report-location" label="Found location" required>
              <input
                aria-describedby={describedBy("report-location", { error: errors.location, hint: hints.location })}
                aria-invalid={Boolean(errors.location)}
                className="field-input"
                id="report-location"
                onChange={(event) => update("location", event.target.value)}
                placeholder="e.g. Central Library, second floor"
                value={values.location}
              />
            </Field>
            <Field error={errors.foundDate} htmlFor="report-date" label="Date found" required>
              <input
                aria-describedby={describedBy("report-date", { error: errors.foundDate })}
                aria-invalid={Boolean(errors.foundDate)}
                className="field-input"
                id="report-date"
                max={today}
                onChange={(event) => update("foundDate", event.target.value)}
                type="date"
                value={values.foundDate}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section-title"><span className="form-section-index">03</span>Photo</legend>
          <ImageUploader file={image} onChange={changeImage} />
        </fieldset>

        <div aria-label="Preview of the public listing" className="listing-preview" role="group">
          <p className="listing-preview-label">How this will appear in the register</p>
          <div className="listing-preview-entry">
            <span className="listing-preview-media">
              {imagePreview
                ? <Image alt="" fill sizes="96px" src={imagePreview} unoptimized />
                : <Icon name="image" />}
            </span>
            <span className="listing-preview-body">
              <span className="entry-meta">
                <span className="entry-category">{values.category || "Category"}</span>
                <span>{previewDate ? `Found ${previewDate}` : "Date found"}</span>
              </span>
              <span className="listing-preview-name">{values.name.trim() || "Item name"}</span>
              <span className="listing-preview-where"><Icon name="pin" />{values.location.trim() || "Where it was found"}</span>
              <span className="listing-preview-text">{values.description.trim() || "The description you write above."}</span>
            </span>
          </div>
          <p className="listing-preview-note"><Icon name="lock" />Your name, email and phone number are not part of the listing.</p>
        </div>

        <fieldset className="form-section">
          <legend className="form-section-title"><span className="form-section-index">04</span>How to reach you</legend>
          <p className="form-section-note">Seen only by the administrator, and shared with the owner once a claim is approved.</p>
          <div className="form-row">
            <Field error={errors.reporterName} htmlFor="reporter-name" label="Your full name" required>
              <input
                aria-describedby={describedBy("reporter-name", { error: errors.reporterName })}
                aria-invalid={Boolean(errors.reporterName)}
                autoComplete="name"
                className="field-input"
                id="reporter-name"
                onChange={(event) => update("reporterName", event.target.value)}
                placeholder="Full name"
                value={values.reporterName}
              />
            </Field>
            <Field error={errors.email} htmlFor="report-email" label="Email address" required>
              <input
                aria-describedby={describedBy("report-email", { error: errors.email })}
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                className="field-input"
                id="report-email"
                onChange={(event) => update("email", event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={values.email}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field error={errors.phone} htmlFor="report-phone" label="Phone number" required>
              <input
                aria-describedby={describedBy("report-phone", { error: errors.phone })}
                aria-invalid={Boolean(errors.phone)}
                autoComplete="tel"
                className="field-input"
                id="report-phone"
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+92 300 1234567"
                type="tel"
                value={values.phone}
              />
            </Field>
            <Field error={errors.whatsapp} htmlFor="report-whatsapp" label="WhatsApp number">
              <input
                aria-describedby={describedBy("report-whatsapp", { error: errors.whatsapp })}
                aria-invalid={Boolean(errors.whatsapp)}
                className="field-input"
                id="report-whatsapp"
                onChange={(event) => update("whatsapp", event.target.value)}
                placeholder="If different from your phone"
                type="tel"
                value={values.whatsapp}
              />
            </Field>
          </div>
          <p className="privacy-note">
            <Icon name="lock" />
            Contact details are never shown on the public listing. Only the administrator can see them.
          </p>
        </fieldset>

        <div className="form-actions">
          <button className="button button-secondary" onClick={onCancel} type="button">Cancel</button>
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? <><span className="loading-indicator" />Sending report…</> : <>Continue <Icon name="arrow-right" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
