"use client";

import Image from "next/image";
import { useState } from "react";
import type { FoundItem } from "@/types/item";
import { formatDate, referenceNumber } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusTag } from "@/components/ui/status-tag";

interface ItemDetailsModalProps {
  item: FoundItem;
  onClaim: () => void;
  onClose: () => void;
}

const checkKeys = ["category", "place", "date"] as const;
type CheckKey = (typeof checkKeys)[number];

export function ItemDetailsModal({
  item,
  onClaim,
  onClose,
}: ItemDetailsModalProps) {
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({ category: false, place: false, date: false });
  const allChecked = checkKeys.every((key) => checks[key]);

  const questions: { key: CheckKey; label: string }[] = [
    { key: "category", label: `What I lost is ${/^[aeiou]/i.test(item.category) ? "an" : "a"} ${item.category.toLowerCase()} item.` },
    { key: "place", label: `I was at or near ${item.location} when I lost it.` },
    { key: "date", label: `I lost it on or before ${formatDate(item.foundDate)}.` },
  ];

  return (
    <Modal onClose={onClose} title={`${item.name} details`} wide>
      <div className="record">
        <div className="record-media">
          {item.image ? (
            <Image
              alt={item.name}
              fill
              sizes="(max-width: 760px) 100vw, 420px"
              src={item.image}
              unoptimized
            />
          ) : (
            <span className="item-image-placeholder"><Icon name="image" />No photo on file</span>
          )}
        </div>
        <div className="record-body">
          <div className="record-topline">
            <span className="kicker kicker-accent">{item.category}<span className="kicker-ref">{referenceNumber(item.id)}</span></span>
            <StatusTag status={item.status} />
          </div>
          <h2 className="record-title">{item.name}</h2>
          <p className="record-description">{item.description}</p>
          <dl className="record-facts">
            <div>
              <dt>Found at</dt>
              <dd>{item.location}</dd>
            </div>
            <div>
              <dt>Date found</dt>
              <dd>{formatDate(item.foundDate)}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{referenceNumber(item.id)}. Quote it if you contact the administrator about this entry.</dd>
            </div>
            <div>
              <dt>Held by</dt>
              <dd>The person who reported it, until an administrator approves a claim.</dd>
            </div>
          </dl>
          {item.status === "Reunited" ? (
            <p className="record-closed" role="status">
              <Icon name="check-circle" />This item has already been reunited with its owner.
            </p>
          ) : (
            <div className="record-actions">
              <fieldset className="match-check">
                <legend>Does this match what you lost?</legend>
                {questions.map(({ key, label }) => (
                  <label className="match-check-row" key={key}>
                    <input
                      checked={checks[key]}
                      onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))}
                      type="checkbox"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <button className="button button-primary" disabled={!allChecked} onClick={onClaim} type="button">
                This is mine <Icon name="arrow-right" />
              </button>
              <p className="record-actions-note">
                {allChecked
                  ? "You will be asked for a detail only the owner would know. It is never shown publicly."
                  : "Tick all three to continue. If any of them is not true, this is probably not your item."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
