import { useSession } from "@clerk/nextjs";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  // const { session } = useSession();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.then((store) => store.getAll());
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.then((store) => store.set(name, value, options))
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      // global: {
      //   // Get the custom Supabase token from Clerk
      //   fetch: async (url, options = {}) => {
      //     // The Clerk `session` object has the getToken() method
      //     const clerkToken = await session?.getToken({
      //       // Pass the name of the JWT template you created in the Clerk Dashboard
      //       // For this tutorial, you named it 'supabase'
      //       template: "supabase",
      //     });

      //     // Insert the Clerk Supabase token into the headers
      //     const headers = new Headers(options?.headers);
      //     headers.set("Authorization", `Bearer ${clerkToken}`);

      //     // Call the default fetch
      //     return fetch(url, {
      //       ...options,
      //       headers,
      //     });
      //   },
      // },
    }
  );
};
