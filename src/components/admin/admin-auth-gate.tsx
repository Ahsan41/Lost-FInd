"use client";

import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { AdminApiError, adminApi, getAdminErrorMessage, type AdminUser } from "@/lib/admin-api";

interface AdminAuthValue {
  user: AdminUser;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

type AuthState =
  | { status: "checking" }
  | { status: "failed"; message: string }
  | { status: "signed-out"; message?: string }
  | { status: "signed-in"; user: AdminUser };

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    try {
      const user = await adminApi.session();
      if (user.role !== "ADMIN") {
        setAuth({ status: "signed-out", message: "Administrator access is required." });
      } else {
        setAuth({ status: "signed-in", user });
      }
    } catch (error) {
      if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
        setAuth({
          status: "signed-out",
          message: error.status === 403 ? "Administrator access is required." : undefined,
        });
      } else {
        setAuth({ status: "failed", message: getAdminErrorMessage(error) });
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminApi.session().then(
      (user) => {
        if (!active) return;
        setAuth(user.role === "ADMIN"
          ? { status: "signed-in", user }
          : { status: "signed-out", message: "Administrator access is required." });
      },
      (error: unknown) => {
        if (!active) return;
        if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
          setAuth({
            status: "signed-out",
            message: error.status === 403 ? "Administrator access is required." : undefined,
          });
        } else {
          setAuth({ status: "failed", message: getAdminErrorMessage(error) });
        }
      },
    );
    const expireSession = () => setAuth({ status: "signed-out", message: "Your session expired. Sign in again." });
    window.addEventListener("admin-session-expired", expireSession);
    return () => {
      active = false;
      window.removeEventListener("admin-session-expired", expireSession);
    };
  }, []);

  const signOut = useCallback(async () => {
    setSignOutError(null);
    try {
      await adminApi.logout();
      setAuth({ status: "signed-out" });
    } catch (error) {
      setSignOutError(getAdminErrorMessage(error));
      setAuth({ status: "signed-out" });
    }
  }, []);

  if (auth.status === "checking") {
    return <div className="admin-auth-state" role="status">Checking administrator session…</div>;
  }
  if (auth.status === "failed") {
    return (
      <div className="admin-auth-state" role="alert">
        <p>{auth.message}</p>
        <button
          className="button button-primary"
          onClick={() => {
            setAuth({ status: "checking" });
            void checkSession();
          }}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }
  if (auth.status === "signed-out") {
    return (
      <AdminLogin
        initialMessage={signOutError ?? auth.message}
        onLogin={(user) => {
          setAuth({ status: "signed-in", user });
          setSignOutError(null);
          router.replace("/admin");
        }}
      />
    );
  }

  return (
    <AdminAuthContext.Provider value={{ user: auth.user, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

function AdminLogin({
  initialMessage,
  onLogin,
}: {
  initialMessage?: string;
  onLogin: (user: AdminUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialMessage ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const user = await adminApi.login(email, password);
      onLogin(user);
    } catch (error) {
      setMessage(getAdminErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section aria-labelledby="admin-login-title" className="auth-card">
        <div className="auth-brand">
          <span className="brand-name">LostNFind</span>
          <span className="desk-badge">Admin</span>
        </div>
        <h1 id="admin-login-title">Welcome back</h1>
        <p className="auth-lede">Sign in to review found-item reports and ownership claims.</p>
        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label className="field-label" htmlFor="admin-email">Email address</label>
            <input
              autoComplete="username"
              autoFocus
              className="field-input"
              id="admin-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="admin-password">Password</label>
            <input
              autoComplete="current-password"
              className="field-input"
              id="admin-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {message && <p className="form-error" role="alert"><Icon name="info" />{message}</p>}
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? <><span className="loading-indicator" />Signing in…</> : "Sign in"}
          </button>
        </form>
        <p className="auth-foot">
          <Icon name="lock" />
          Administrator accounts are created by the LostNFind API. There is no public sign-up.
        </p>
      </section>
    </main>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthGate.");
  return context;
}
