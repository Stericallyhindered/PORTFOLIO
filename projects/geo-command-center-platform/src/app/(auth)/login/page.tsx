import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login/LoginForm";
import { isOpenAccessMode } from "@/lib/config";

export const metadata = {
  title: "Login | GEO Command Center",
};

export default async function LoginPage() {
  if (isOpenAccessMode()) {
    redirect("/app/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            GEO Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Log in to orchestrate AI visibility and GEO programs.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

