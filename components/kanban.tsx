import React, { useState } from "react";


{/*Se setean los types permitidos para cada valor*/}
type Estado = 'toDo' | 'inProgress' | 'done';

type Rol = 'atleta' | 'entrenador' | 'director';

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
  { id: 'toDo', title: 'Por hacer' },
  { id: 'inProgress', title: 'En progreso' },
  { id: 'done', title: 'Terminado' },
];

{/*Tasks placeholder antes de conectar con la base de datos */}
const Tarjetas_ph: Tarjeta[] = [
    { id_tarjeta: 1, titulo: 'Entrenar brazo', descripcion: '', estado: 'toDo', id_atleta: 2, tipo: 'tecnica'},
    { id_tarjeta: 2, titulo: 'Entrenar pierna', descripcion: '', estado: 'done', id_atleta: 2, tipo: 'tecnica'}

];

//se exportan las tarjetas a otras partes del programa
export default function kanban() {
    //Se define el usestate de tarjetas, valor actual y funcion para reemplazarlo
    const [tarjetas, setTarjetas] = useState<Tarjeta[]>(Tarjetas_ph);
    // Id de tarjeta seleccionada (numero o null)
    const [selected, setSelected] = useState<number | null>(null);

    //busca el id de la tarjeta seleccionada
    const tarjetaSelect = tarjetas.find((t) => t.id_tarjeta === selected);
    // verifica que se encontro la tarjeta. Si no devuelve -1. Es la columna actual de la tarjeta
    const indexSelect = tarjetaSelect ? COLUMNS.findIndex((c) => c.id === tarjetaSelect.estado) : -1;

    //delta solo puede ser +1 o -1 (tarjeta se mueve 1 tablero adelante o atras)
    const move = (delta: -1 | 1) => {
      //si no se selecciono tarjeta, se acaba la funcion.
        if (!tarjetaSelect) return;
        //index
        const destino = COLUMNS[indexSelect + delta]
        if (!destino) return;
        //crea valor prev que recibe la lista, y es leida uno por uno por map
        setTarjetas((prev) =>
        //se genera una nueva lista de tarjetas, se actualizan los datos y reemplaza a la anterior 
        prev.map((t) => (t.id_tarjeta === tarjetaSelect.id_tarjeta ? { ...t, estado: destino.id} : t))
      );
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
      border: t.id_tarjeta === selected ? '3px solid green' : '3px white',
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
    {/* botones para mover la tarjeta seleccionada*/}
    <div style={{ marginBottom: 10 }}>

      {/* Se desactiva si no hay columna a la que mover o no hay tarjeta seleccionada*/}
      <button style={{marginRight:10}} onClick= {() => move(-1)} disabled={!tarjetaSelect || indexSelect === 0}>
        {'<--'} Retroceder
      </button>
      
      <button onClick= {() => move(1)} disabled={!tarjetaSelect || indexSelect === COLUMNS.length -1}>
        Avanzar {'-->'}
      </button>
      
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