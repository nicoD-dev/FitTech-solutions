// Se importa el componente desde kanban.tsx
import Kanban from './components/kanban';
import Login from './components/Login';
import { useAuth } from './useAuth';
import { supabase } from './supabase';
import CrearCuenta from './components/CrearCuenta';

export default function App() {
  const { session, perfil, cargando } = useAuth();
  if (cargando) return <p>Cargando...</p>;
  if (!session) return <Login/>
  {/* Si no se detecta un perfil al recibir los datos */}
  if (!perfil) {
    return (
      <div style={{ padding: 16 }}>
        <p>Tu usuario no tiene un perfil asignado. Pedile al director que lo cree.</p>
        <button onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', width: '100vw'}}>
      <h1>FitTech</h1>
      <p style={{margin:0}}>
        {session.user.email} · {perfil.rol}{' '}
        <button onClick={() => supabase.auth.signOut()}>Salir</button>
      </p>
      {/* Se dibuja el tablero */}
      <div><Kanban rol={perfil.rol} idAtletaPropio={perfil.id_atleta}/></div>
      {/* Solo el director ve el formulario de cuentas */}
      {perfil.rol === 'director' && <CrearCuenta />}
      
    </div>
  );
}