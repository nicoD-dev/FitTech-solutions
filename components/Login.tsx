import { useState } from "react";
import type { FormEvent } from 'react';
import { supabase } from "../supabase";


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);


const entrar = async (e: FormEvent) => {
    {/* Se evita que el formulario recargue la pagina */}
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const {error} = await supabase.auth.signInWithPassword({ email, password });

    {/* Si no hay errores useAuth detecta la sesion */}
    if (error) setError('Email o contraseña incorrectos');
    setEnviando(false);
};

return (
    <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 200, margin: '80px auto'}}>
        <h1>FitTech</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required/>
        <button type="submit" disabled={enviando}>
            {enviando ? 'Ingresando' : 'Ingresar'}
        </button>
        {error && <p style={{ color: 'red'}}>{error}</p>}
    </form>
)
}