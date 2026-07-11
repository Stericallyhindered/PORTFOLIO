import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/auth-helpers-nextjs";

const getCookieAdapter = async () => {
  const cookieStore = await cookies();

  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    getAll() {
      return cookieStore.getAll().map((c) => ({
        name: c.name,
        value: c.value,
      }));
    },
    set(name: string, value: string, options: CookieOptions) {
      cookieStore.set({ name, value, ...options });
    },
    setAll(items: { name: string; value: string; options: CookieOptions }[]) {
      items.forEach((item) => {
        cookieStore.set({ name: item.name, value: item.value, ...item.options });
      });
    },
    remove(name: string, options: CookieOptions) {
      cookieStore.set({ name, value: "", ...options, maxAge: 0 });
    },
  };
};

export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        async getSession() {
          return { data: { session: null }, error: null };
        },
      },
    } as any;
  }

  const cookieAdapter = await getCookieAdapter();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
  });
}

