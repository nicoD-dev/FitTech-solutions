import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabase';
import type { Rol } from '../useAuth';

// Definicion de useStates usados
export default function CrearCuenta() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState<Rol>('atleta');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null)
    const [enviando, setEnviando] = useState(false);
    const [categoria, setCategoria] = useState('');

    // Se ejecuta al enviar el formmulario (boton de crear cuenta)
    const crear = async (e: FormEvent) =>
    {
        // Previene la funcion default del formulario de recargar pagina
        e.preventDefault();
        // Se borra el estado anterior, antes de otro intento
        setEnviando(true);
        setMensaje(null);
        setError(null);


        {/* Llama a la edge function */}
        const {error: errorFn} = await supabase.functions.invoke('crear-usuario', 
            {
                body: {
                    email, password, rol,
                    // Si el rol es atleta se envian sus datos para crearlo. Si no, null.
                    atleta_nuevo: rol === 'atleta' ? { nombre, apellido, categoria_peso: Number(categoria) } : null,
                },
            });

        if(errorFn) {
            {/* Si la funcion da error, el mensaje viene en la respuesta 
                Por defecto se usa el mensaje generico de supabase */}
            let texto = errorFn.message;
            try {
                // Si la funcion responde con mensahe propio
                texto = (await errorFn.context.json()).error ?? texto;
            } catch {

            }
            setError(texto);
        } else {
            // Operacion exitosa. Se vacia el formulario para repetir el proceso
            setMensaje(`Cuenta creada para ${email}`);
            setEmail('');
            setPassword('');
            setNombre('');
            setApellido('');
            setCategoria('');
        }
        // Se reabilita el boton, salga bien o mal la operacion
        setEnviando(false);
    };
    return (
        
    <form onSubmit={crear} style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 260, marginTop: 24 }}>
        <h3>Crear cuenta</h3>
        {/* "required" y "minLength" hacen que el navegador valide antes de enviar */}
        <input type='email' placeholder='email' value={email} onChange={(e) => setEmail(e.target.value)} required/>
        <input type="password" placeholder="Contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />

        {/* "as Rol" le indica a TypeScript que el valor del desplegable es uno de los tres roles */}
        <select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
            <option value='atleta'>Atleta</option>
            <option value='entrenador'>Entrenador</option>
            <option value='director'>Director</option>
        </select>

        {/* Solo las cuentas de atleta se vinculan a un registro de la tabla atleta */}
        {rol === 'atleta' && (
            <>
            {/* Se piden datos de atleta nuevo */}
            <>
            <input placeholder='Nombre' value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <input placeholder='Apellido' value={apellido} onChange={(e) => setApellido(e.target.value)} required />  
            <input type='number' placeholder='Categoría de peso (kg)' value={categoria} onChange={(e) => setCategoria(e.target.value)} min={30} max={200} required />
            </>
        </>
    )}

    <button type="submit" disabled={enviando}>
        {/* Mientras "enviando" es true el boton queda desactivado y cambia su texto */}
        {enviando ? ' Creando...': 'Crear cuenta'}
        </button>
        {mensaje && <p style={{color: 'green'}}>{mensaje}</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
    );    
}