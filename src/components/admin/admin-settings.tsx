"use client";

import { useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-gate";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Icon } from "@/components/ui/icon";

const initialPreferences = {
  newReportAlerts: true,
  claimAlerts: true,
  weeklySummary: false,
};

export function AdminSettings() {
  const { user } = useAdminAuth();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [notice, setNotice] = useState("");

  function toggle(key: keyof typeof initialPreferences) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setNotice("");
  }

  return (
    <>
      <div className="desk-page-head">
        <div>
          <h2>Workspace settings</h2>
          <p>Your administrator account is managed by the LostNFind API. Notification preferences below are a local preview and are not saved.</p>
        </div>
      </div>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}

      <div className="settings-stack">
        <section aria-labelledby="account-title" className="panel">
          <div className="panel-head">
            <div>
              <h3 id="account-title">Account</h3>
              <p>Signed-in administrator</p>
            </div>
          </div>
          <dl className="facts facts-inset">
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>Administrator</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>Kept in a secure cookie; expires automatically.</dd>
            </div>
          </dl>
        </section>

        <section aria-label="Notification preferences" className="panel">
          <div className="panel-head">
            <div>
              <h3>Notifications</h3>
              <p>Preview only. Email notifications are sent by the API regardless of these switches.</p>
            </div>
          </div>
          <label className="setting-row" htmlFor="setting-report-alerts">
            <span><strong>New found-item reports</strong><p>Show a notification when a community report arrives.</p></span>
            <input checked={preferences.newReportAlerts} className="toggle" id="setting-report-alerts" onChange={() => toggle("newReportAlerts")} type="checkbox" />
          </label>
          <label className="setting-row" htmlFor="setting-claim-alerts">
            <span><strong>Claim requests</strong><p>Show a notification when someone submits an ownership claim.</p></span>
            <input checked={preferences.claimAlerts} className="toggle" id="setting-claim-alerts" onChange={() => toggle("claimAlerts")} type="checkbox" />
          </label>
          <label className="setting-row" htmlFor="setting-weekly-summary">
            <span><strong>Weekly community summary</strong><p>Preview a weekly overview of reports, claims, and returned items.</p></span>
            <input checked={preferences.weeklySummary} className="toggle" id="setting-weekly-summary" onChange={() => toggle("weeklySummary")} type="checkbox" />
          </label>
          <div className="settings-foot">
            <p>Applies to this browser session only.</p>
            <button className="button button-secondary button-small" onClick={() => setNotice("Preference preview updated for this browser session only. Nothing was saved.")} type="button">
              <Icon name="check" />Apply preview
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
