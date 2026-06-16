import { supabase as sharedSupabase } from "@/lib/supabase";
import { type Request, type Response, type NextFunction } from "express";

export const supabaseMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const supabase = sharedSupabase;

  // This will refresh the session if it's expired with graceful try-catch error handling
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('[Supabase Server Middleware] Session verification or token refresh failed safely:', error.message);
      
      // If the request is a direct navigation to a view page (not static or api), redirect to login page gracefully
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
        console.log('[Supabase Server Middleware] Redirecting to login/landing page...');
        res.clearCookie('sb-access-token');
        res.clearCookie('sb-refresh-token');
        return res.redirect('/');
      }
    }
  } catch (err: any) {
    console.error('[Supabase Server Middleware] Expired or invalid session exception caught gracefully:', err?.message || err);
    
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
      res.clearCookie('sb-access-token');
      res.clearCookie('sb-refresh-token');
      return res.redirect('/');
    }
  }

  next();
};
