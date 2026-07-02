"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Mail, UserRound, Wrench } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  return (
    <main className="auth-shell">
      <section className="auth-copy">
        <Link className="back-link" href="/">
          BINFORGE
        </Link>
        <span className="eyebrow">Supabase Auth</span>
        <h1>{mode === "signup" ? "Create your tuning account" : "Welcome back to your garage"}</h1>
        <p>
          Use username and password auth so every vehicle, project, alias, theme preset, and future AI conversation stays tied to
          your own workspace.
        </p>
        <div className="auth-points">
          <div className="pill-row">
            <Wrench size={16} />
            Vehicle-first organization
          </div>
          <div className="pill-row">
            <Lock size={16} />
            Preferences stored per user
          </div>
          <div className="pill-row">
            <Mail size={16} />
            AI toggle defaulted off
          </div>
        </div>
      </section>

      <section className="card-glass auth-card">
        <div className="segment-control">
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")} type="button">
            Sign up
          </button>
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")} type="button">
            Sign in
          </button>
        </div>

        <form className="auth-form">
          <label>
            <span>Username</span>
            <div className="field-shell">
              <UserRound size={16} />
              <input placeholder="boostedmatt" type="text" />
            </div>
          </label>

          <label>
            <span>Email</span>
            <div className="field-shell">
              <Mail size={16} />
              <input placeholder="matt@shop.com" type="email" />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="field-shell">
              <Lock size={16} />
              <input placeholder="••••••••••••" type="password" />
            </div>
          </label>

          <button className="button button-primary button-block" type="submit">
            {mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="helper-copy">This UI is ready to connect to Supabase auth using the helpers in `lib/supabase/*`.</p>
        <Link className="button button-secondary button-block" href="/dashboard">
          Continue to Garage Demo
        </Link>
      </section>
    </main>
  );
}
