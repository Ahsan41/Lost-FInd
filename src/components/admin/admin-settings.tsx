"use client";

import { useState } from "react";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Icon } from "@/components/ui/icon";

const initialPreferences = {
  newReportAlerts: true,
  claimAlerts: true,
  weeklySummary: false,
};

export function AdminSettings() {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [notice, setNotice] = useState("");

  function toggle(key: keyof typeof initialPreferences) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setNotice("");
  }

  return (
    <>
      <div className="admin-page-intro">
        <div>
          <h2>Workspace settings</h2>
          <p>Adjust notification preferences for this local preview. Admin account and report data are managed by the LostNFind API.</p>
        </div>
      </div>
      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}
      <section aria-label="Notification preferences" className="admin-settings-card">
        <div className="admin-panel-header">
          <div><h3>Notifications</h3><p>Choose which updates you would like to preview in this prototype.</p></div>
        </div>
        <label className="admin-setting-row" htmlFor="setting-report-alerts">
          <span><strong>New found-item reports</strong><p>Show a notification when a community report arrives.</p></span>
          <input checked={preferences.newReportAlerts} className="admin-toggle" id="setting-report-alerts" onChange={() => toggle("newReportAlerts")} type="checkbox" />
        </label>
        <label className="admin-setting-row" htmlFor="setting-claim-alerts">
          <span><strong>Claim requests</strong><p>Show a notification when someone submits an ownership claim.</p></span>
          <input checked={preferences.claimAlerts} className="admin-toggle" id="setting-claim-alerts" onChange={() => toggle("claimAlerts")} type="checkbox" />
        </label>
        <label className="admin-setting-row" htmlFor="setting-weekly-summary">
          <span><strong>Weekly community summary</strong><p>Preview a weekly overview of reports, claims, and returned items.</p></span>
          <input checked={preferences.weeklySummary} className="admin-toggle" id="setting-weekly-summary" onChange={() => toggle("weeklySummary")} type="checkbox" />
        </label>
        <div className="admin-settings-footer">
          <button className="button button-primary" onClick={() => setNotice("Preference preview updated for this browser session only. Nothing was saved.")} type="button">
            <Icon name="check" />Save preference preview
          </button>
        </div>
      </section>
    </>
  );
}
