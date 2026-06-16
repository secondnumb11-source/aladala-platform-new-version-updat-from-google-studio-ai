import { supabase } from "@/lib/supabase";
import { type Request, type Response } from "express";

export const createClient = (_req?: Request, _res?: Response) => {
  return supabase;
};
