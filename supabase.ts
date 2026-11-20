import { createClient } from "@supabase/supabase-js";

{/* Usa los valores de .env, VITE expone variables que empiecen con ese nombre */}
const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

{/* Establece conexion con el backend en supabase */}
export const supabase = createClient(url, key);