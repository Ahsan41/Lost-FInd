"use client";

import { useAdminAuth } from "@/components/admin/admin-auth-gate";

/**
 * Settings is deliberately small: the account the API signed in, and a plain
 * description of what the register does on its own (the emails the API sends),
 * so the administrator knows what each decision triggers. Nothing here is a
 * preference, because the API has none to set.
 */
export function AdminSettings() {
  const { user } = useAdminAuth();

  return (
    <>
      <div className="desk-page-head">
        <div>
          <h2>Workspace</h2>
          <p>Your account and what the register sends on your behalf. Both are managed by the LostNFind API.</p>
        </div>
      </div>

      <div className="settings-stack">
        <section aria-labelledby="account-title" className="settings-block">
          <h3 id="account-title">Account</h3>
          <dl className="facts">
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
              <dd>Kept in a secure cookie that expires on its own. Sign out from the top bar to end it early.</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="mail-title" className="settings-block">
          <h3 id="mail-title">What the register sends</h3>
          <ol className="mail-rules">
            <li>
              <span className="mail-rules-when">A claim is submitted</span>
              <span className="mail-rules-what">You receive an email so it can be reviewed.</span>
            </li>
            <li>
              <span className="mail-rules-when">You approve a claim</span>
              <span className="mail-rules-what">The claimant receives the finder’s contact details, and the finder receives the claimant’s. Other pending claims on the item are rejected.</span>
            </li>
            <li>
              <span className="mail-rules-when">You reject a claim</span>
              <span className="mail-rules-what">The claimant is told the claim was not accepted. The item stays listed.</span>
            </li>
            <li>
              <span className="mail-rules-when">You mark an item returned</span>
              <span className="mail-rules-what">The approved claimant is told the entry is closed. The item shows as reunited in the public register.</span>
            </li>
          </ol>
          <p className="settings-note">Approving or rejecting a report sends nothing. Reporters see the outcome in the public register.</p>
        </section>
      </div>
    </>
  );
}
