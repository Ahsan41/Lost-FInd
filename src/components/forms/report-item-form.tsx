"use client";

import { useRef, useState, type FormEvent } from "react";
import { itemCategories } from "@/types/item";
import { isValidEmail, isValidPhone } from "@/lib/format";
import {
  getApiFieldErrors,
  getPublicApiErrorMessage,
  publicApi,
  type ReportItemInput,
} from "@/lib/public-api";
import { Icon } from "@/components/ui/icon";
import { Field } from "@/components/ui/field";
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
      <div className="modal-content">
        <div className="success-state">
          <span className="success-icon"><Icon name="check-circle" /></span>
          <h3>Thanks for looking out</h3>
          <p>Your report has been sent for review. It will appear in the public listings after an administrator approves it.</p>
          <button className="button button-primary" onClick={onDone} type="button">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-content">
      <div className="modal-heading">
        <p className="eyebrow"><span className="eyebrow-dot" />Help bring it home</p>
        <h2 className="modal-title">Report a found item</h2>
        <p className="modal-description">Share a few details so its owner can recognize it. Your contact details won’t appear publicly.</p>
      </div>
      <form className="form-stack" noValidate onSubmit={handleSubmit}>
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <div className="form-grid">
          <Field error={errors.name} htmlFor="report-name" label="Item name" required>
            <input aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "report-name-error" : undefined} autoComplete="off" className="field-input" id="report-name" onChange={(event) => update("name", event.target.value)} placeholder="e.g. Blue water bottle" value={values.name} />
          </Field>
          <Field error={errors.category} htmlFor="report-category" label="Category" required>
            <select aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? "report-category-error" : undefined} className="field-input" id="report-category" onChange={(event) => update("category", event.target.value)} value={values.category}>
              <option value="">Choose a category</option>
              {itemCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>
        </div>
        <Field error={errors.description} htmlFor="report-description" label="Description" required>
          <textarea aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "report-description-error" : undefined} className="field-input" id="report-description" onChange={(event) => update("description", event.target.value)} placeholder="Colour, distinguishing features, or where it is being held" value={values.description} />
        </Field>
        <div className="form-grid">
          <Field error={errors.location} htmlFor="report-location" label="Found location" required>
            <input aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "report-location-error" : undefined} className="field-input" id="report-location" onChange={(event) => update("location", event.target.value)} placeholder="Place, street, or landmark" value={values.location} />
          </Field>
          <Field error={errors.foundDate} htmlFor="report-date" label="Date found" required>
            <input aria-invalid={Boolean(errors.foundDate)} aria-describedby={errors.foundDate ? "report-date-error" : undefined} className="field-input" id="report-date" max={new Date().toISOString().slice(0, 10)} onChange={(event) => update("foundDate", event.target.value)} type="date" value={values.foundDate} />
          </Field>
        </div>
        <ImageUploader file={image} onChange={setImage} />
        <div className="form-grid">
          <Field error={errors.reporterName} htmlFor="reporter-name" label="Your full name" required>
            <input aria-invalid={Boolean(errors.reporterName)} aria-describedby={errors.reporterName ? "reporter-name-error" : undefined} autoComplete="name" className="field-input" id="reporter-name" onChange={(event) => update("reporterName", event.target.value)} placeholder="Full name" value={values.reporterName} />
          </Field>
          <Field error={errors.email} htmlFor="report-email" label="Email address" required>
            <input aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "report-email-error" : undefined} autoComplete="email" className="field-input" id="report-email" onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" type="email" value={values.email} />
          </Field>
        </div>
        <div className="form-grid">
          <Field error={errors.phone} htmlFor="report-phone" label="Phone number" required>
            <input aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "report-phone-error" : undefined} autoComplete="tel" className="field-input" id="report-phone" onChange={(event) => update("phone", event.target.value)} placeholder="+1 555 012 3456" type="tel" value={values.phone} />
          </Field>
          <Field error={errors.whatsapp} htmlFor="report-whatsapp" label="WhatsApp number">
            <input aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? "report-whatsapp-error" : undefined} className="field-input" id="report-whatsapp" onChange={(event) => update("whatsapp", event.target.value)} placeholder="Optional" type="tel" value={values.whatsapp} />
          </Field>
        </div>
        <div className="steps-note"><Icon name="shield" />We never show your personal contact information on a public item listing.</div>
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
