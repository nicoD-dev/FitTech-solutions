import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";


export type Rol = 'atleta' | 'entrenador' | 'director';

export interface Perfil {
    rol: Rol;
    id_atleta: number | null;
}

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    {/* Undefined si aun no se cargo el perfil. Null si no se encuentra */}
    const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
    const [iniciando, setIniciando] = useState(true);


{/* Averigua si ya hay una sesion guardada */}
useEffect(() => {
    {/* Verifica si hay una sesion activa */}
    supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setIniciando(false);
    });
    const {data} = supabase.auth.onAuthStateChange((_evento, nueva) => setSession(nueva));
    {/* Una vez realizado el proceso, de deja de verificar constantemente */}
    return () => data.subscription.unsubscribe();
}, []);

useEffect(() => {
    if (!session) {
        setPerfil(undefined);
        return;
    }
    let activa = true;
    supabase
    .from('perfiles')
    .select('rol, id_atleta')
    .eq('id', session.user.id)
    .single<Perfil>()
    .then(({data}) => {
        if (activa) setPerfil(data ?? null);
    });

    return () => {
        activa = false;
    };
}, [session]);

{/* Estado de carga */}
const cargando = iniciando || (session !== null && perfil === undefined);

return {session, perfil: perfil ?? null, cargando};
}