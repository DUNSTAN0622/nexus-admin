import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, isAuthSessionMissingError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  normalizeUserRole,
  type StoredUserRole,
  type UserRole,
} from "@/utils/rbac";

export type { UserRole } from "@/utils/rbac";

export type UserProfile = {
  id: string;
  fullName: string | null;
  role: UserRole | null;
};

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or Supabase publishable/anon key.",
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}

function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return serviceRoleKey;
}

export function createAdminSupabaseClient() {
  const { supabaseUrl } = getSupabaseCredentials();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = getSupabaseCredentials();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie);
          }
        } catch {
          // Server Components may not always be allowed to mutate cookies.
        }
      },
    },
  });
});

export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (isAuthSessionMissingError(userError)) {
      return null;
    }

    throw new Error(userError.message);
  }

  if (!user) {
    return null;
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle<{
      role: StoredUserRole | null;
      full_name: string | null;
    }>();

  if (employeeError) {
    throw new Error(employeeError.message);
  }

  return {
    id: user.id,
    fullName: employee?.full_name ?? null,
    role: normalizeUserRole(employee?.role),
  };
});
