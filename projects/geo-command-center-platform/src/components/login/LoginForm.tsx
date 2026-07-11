"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LoginSchema = z.object({
  email: z.string().email(),
});

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const parsed = LoginSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage("Check your email for a magic link.");
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Work email
        </label>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black/40 text-white placeholder:text-white/40"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      <Button
        type="submit"
        className="mt-2 w-full"
        disabled={isSubmitting || !email}
      >
        {isSubmitting ? "Sending magic link..." : "Send magic link"}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        We use passwordless magic links. No passwords to remember.
      </p>
    </form>
  );
}

