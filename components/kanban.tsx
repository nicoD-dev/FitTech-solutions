import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabase";
import type { Rol } from "../useAuth";

// Nombres de las tablas en Supabase (si cambian, solo se cambia el valor de estas variables)
const TABLA_TARJETAS = 'tarjetas';
const TABLA_ATLETAS = 'atletas';

interface AtletaOpcion {
  id_atleta: number;
  nombre: string;
  apellido: string;
}

interface Props {
  rol: Rol;
  idAtletaPropio: number | null;   // solo tiene valor si el rol es atleta
}

{/*Se setean los types permitidos para cada valor*/}
type Estado = 'para_hacer' | 'haciendo' | 'hecho';

type TipoTarjeta = 'tecnica' | 'apto_medico' | 'peso';

interface Tarjeta {
  id_tarjeta: number;
  titulo: string;
  descripcion: string;
  estado: Estado;
  id_atleta: number;
  tipo: TipoTarjeta;
}

{/*Se definen las columnas del tablero kanban*/}
const COLUMNS: { id: Estado; title: string } [] = [
  { id: 'para_hacer', title: 'Por hacer' },
  { id: 'haciendo', title: 'En progreso' },
  { id: 'hecho', title: 'Terminado' },
];


//se exportan las tarjetas a otras partes del programa
export default function kanban({rol, idAtletaPropio}: Props) {
    //Se define el usestate de tarjetas, valor actual y funcion para reemplazarlo
    const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
    // Id de tarjeta seleccionada (numero o null)
    const [selected, setSelected] = useState<number | null>(null);

    // Lista de atletas y atleta elegido (solo lo usan entrenador y director)
    const [atletas, setAtletas] = useState<AtletaOpcion[]>([]);
    const [atletaSel, setAtletaSel] = useState<number | null>(null);
    
     // Campos del formulario de nueva tarjeta
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevaDesc, setNuevaDesc] = useState('');
    const [nuevoTipo, setNuevoTipo] = useState<TipoTarjeta>('tecnica');
    const [errorForm, setErrorForm] = useState<string | null>(null);

    const puedeCrear = rol !== 'atleta';
    // El atleta ve siempre lo suyo; los otros roles ven el atleta elegido en el selector
    const idAtleta = rol === 'atleta' ? idAtletaPropio : atletaSel;

    {/* Carga la lista de atletas para el director y entrenador */}
    useEffect(() => {
      if (!puedeCrear) return;
      supabase.from(TABLA_ATLETAS).select('id_atleta, nombre, apellido').order('apellido').then(({data}) => {
        if (data) {
          setAtletas(data);
          if (data.length) setAtletaSel(data[0].id_atleta);
        }
      });
    }, [puedeCrear]);

    {/* Cada vez que cambia el atleta, carga sus tarjetas */}
    useEffect(() => {
      setSelected(null);
      if (!idAtleta) { setTarjetas([]); return; }
      supabase.from(TABLA_TARJETAS).select('*').eq('id_atleta', idAtleta).order('id_tarjeta')
        .then(({ data }) => setTarjetas((data ?? []) as Tarjeta[]));
    }, [idAtleta]);

    //busca el id de la tarjeta seleccionada
    const tarjetaSelect = tarjetas.find((t) => t.id_tarjeta === selected);
    // verifica que se encontro la tarjeta. Si no devuelve -1. Es la columna actual de la tarjeta
    const indexSelect = tarjetaSelect ? COLUMNS.findIndex((c) => c.id === tarjetaSelect.estado) : -1;

    //delta solo puede ser +1 o -1 (tarjeta se mueve 1 tablero adelante o atras)
    const move = async (delta: -1 | 1) => {
      //si no se selecciono tarjeta, se acaba la funcion.
        if (!tarjetaSelect) return;
        //index
        const destino = COLUMNS[indexSelect + delta]
        if (!destino) return;

        // Primero se guarda la base. Si falla, la pantalla no cambia
        const {error} = await supabase.from(TABLA_TARJETAS).update({estado: destino.id}).eq('id_tarjeta', tarjetaSelect.id_tarjeta);
        if (error) return;
        //crea valor prev que recibe la lista, y es leida uno por uno por map
        setTarjetas((prev) =>
        //se genera una nueva lista de tarjetas, se actualizan los datos y reemplaza a la anterior 
        prev.map((t) => (t.id_tarjeta === tarjetaSelect.id_tarjeta ? { ...t, estado: destino.id} : t))
      );
    };

    const crearTarjeta = async (e: FormEvent) => {
      e.preventDefault();
      if (!idAtleta || !nuevoTitulo.trim()) return;
      setErrorForm(null);

      // Inserta en la base y devuelve la fila creada
      const {data, error} = await supabase.from(TABLA_TARJETAS)
      .insert({
        titulo: nuevoTitulo.trim(),
        descripcion: nuevaDesc.trim(),
        estado: COLUMNS[0].id,
        id_atleta: idAtleta,
        tipo: nuevoTipo,
      })
      .select().single<Tarjeta>();

      if (error) { setErrorForm(error.message); return; }

      // Se agrega a la lista local y se limpia el formulatio
      setTarjetas((prev) => [...prev, data]);
      setNuevoTitulo('');
      setNuevaDesc('');
      setNuevoTipo('tecnica');
    };

    // ELiminar tarjetas seleccionadas
    const eliminarTarjeta = async () => {
      if (!tarjetaSelect) return;
    // Pide confirmacion antes de borrar
    if (!window.confirm(`¿Eliminar la tarjeta "${tarjetaSelect?.titulo}"?`)) return;

    // select devuelve la fila borrada. Si es vacio no se elimino nada 
    const {data, error} = await supabase.from(TABLA_TARJETAS).delete().eq('id_tarjeta', tarjetaSelect?.id_tarjeta).select();

    if (error) {setErrorForm(error.message); return;}
    if (!data || data.length===0) {setErrorForm('No se pudo eliminar'); return;}

    //se saca de la lista local y deselecciona
    setTarjetas((prev) => prev.filter((t) => t.id_tarjeta !== tarjetaSelect?.id_tarjeta));
    setSelected(null);
  };



{/*Diseño de tarjetas */}
const renderTarjeta = (t: Tarjeta) => (
  <div
  // Se crea key para identificar cambios sin problemas
    key={t.id_tarjeta}
    onClick={() => setSelected(t.id_tarjeta)}
    //se define el estilo de las tarjetas
    style={{
      background: 'white',
      padding: 8,
      marginBottom: 6,
      cursor: 'pointer',
      border: t.id_tarjeta === selected ? '3px solid green' : '3px solid transparent',
    }}>
      {t.titulo}      
    </div>
);

const renderColumna = (col: {id: Estado; title: string}) => (
  <div 
  key={col.id}
  style={{ flex: 1,
  background: 'grey',
  padding: 8, 
  minHeight: 140
  }}>
    <h3>{col.title}</h3>
    {/* Solo las tarjetas cuyo estado coincide con esta columna */}
    {tarjetas.filter((t) => t.estado === col.id).map(renderTarjeta)}
  </div>
);


    
return (
  <div>

    {/* Entrenador y director eligen atleta y crean tarjetas */}
    {puedeCrear && (
      <div style={{ marginBottom: 10 }}>
        <label>
          Atleta:{' '}
          <select value={atletaSel ?? ''} onChange={(e) => setAtletaSel(Number(e.target.value))}>
            {atletas.map((a) => (
              <option key={a.id_atleta} value={a.id_atleta}>
                {a.apellido}, {a.nombre}
              </option>
            ))}
          </select>
        </label>


        <form onSubmit={crearTarjeta} style={{display: 'flex', gap: 7, margin: 10, flexWrap: 'wrap'}}>
          <input placeholder="Titulo" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} required/>
          <input placeholder="Descripcion" value={nuevaDesc} onChange={(e) => setNuevaDesc(e.target.value)}/>
          <select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value as TipoTarjeta)}>
            <option value='tecnica'>Técnica</option>
            <option value='apto_medico'>Apto medico</option>
            <option value='peso'>Peso</option>
          </select>
          <button type="submit" disabled={!idAtleta}>Crear tarjeta</button>
        </form>
        {errorForm && <p style={{color: 'red'}}>{errorForm}</p>}
      </div>
    )}


    {/* botones para mover la tarjeta seleccionada*/}
    <div style={{ marginBottom: 10 }}>

      {/* Se desactiva si no hay columna a la que mover o no hay tarjeta seleccionada*/}
      <button style={{marginRight:10}} onClick= {() => move(-1)} disabled={!tarjetaSelect || indexSelect === 0}>
        {'<--'} Retroceder
      </button>
      
      <button onClick= {() => move(1)} disabled={!tarjetaSelect || indexSelect === COLUMNS.length -1}>
        Avanzar {'-->'}
      </button>
      {/* Solo entrenador y director pueden eliminar tarjetas */}
      {puedeCrear && (
        <button style={{marginLeft:10}} onClick={eliminarTarjeta} disabled={!tarjetaSelect}>
          Eliminar tarjeta
        </button>
      )}
      {/* Muestra tarjeta seleccionada, o le dice al usuario que seleccione una*/}
      <span style={{ marginLeft: 12 }}>
      {tarjetaSelect ? `Seleccionada: ${tarjetaSelect.titulo}` : 'Elegí una tarea'}
      </span>
    </div>
    
      {/* Alinea las columnas una al lado de la otra */}
      <div style={{ display: 'flex', gap: 12 }}>
        {COLUMNS.map(renderColumna)}
      </div>
    </div>
  );
};