import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type Request, type Response, type NextFunction } from "express";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sydcelofkzvtsfatxnka.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_VW8gI2hAK_UzF8ApuoUUhA_KUmR1KYz";

export const supabaseMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
           return Object.entries(req.cookies).map(([name, value]) => ({
             name,
             value: value as string,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
             res.cookie(name, value, options as CookieOptions);
          });
        },
      },
    },
  );

  // This will refresh the session if it's expired
  await supabase.auth.getUser();

  next();
};
