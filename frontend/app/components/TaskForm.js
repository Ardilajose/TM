"use client";

import { useState } from "react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);
const NUEVA = "__nueva__";

export default function TaskForm({
  onCerrar,
  onCrear,
  existentes = [],            // todas las tareas actuales (esto para revisar codigos)
  etiquetasExistentes = [],   // etiquetas que ya existen
}) {
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 11 }, (_, i) => anioActual - 1 + i);

  const [f, setF] = useState({
    tipo: "Tarea",
    codigo: "",
    titulo: "",
    dia: "",
    mes: "",
    anio: String(anioActual),   // el año actual ya esta seleccionado
    prioridad: "Media",
    notas: "",
  });
  const [etiquetas, setEtiquetas] = useState([]);
  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const [textoEtiqueta, setTextoEtiqueta] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const poner = (campo, valor) => setF((prev) => ({ ...prev, [campo]: valor }));

  // .................... codigo repetido ....................
  const duplicado =
    f.codigo !== "" ? existentes.find((t) => t.codigo === Number(f.codigo)) : undefined;

  // .................... etiquetas ....................
  const disponibles = etiquetasExistentes.filter((e) => !etiquetas.includes(e));

  function agregarEtiqueta(valor) {
    const limpia = valor.trim().toLowerCase();
    if (limpia === "") return;
    setEtiquetas((prev) => (prev.includes(limpia) ? prev : [...prev, limpia]));
  }

  function quitarEtiqueta(valor) {
    setEtiquetas((prev) => prev.filter((e) => e !== valor));
  }

  function cambiarSelectEtiqueta(evento) {
    const valor = evento.target.value;
    if (valor === NUEVA) setCreandoEtiqueta(true);
    else if (valor) agregarEtiqueta(valor);
  }

  function confirmarNuevaEtiqueta() {
    agregarEtiqueta(textoEtiqueta);
    setTextoEtiqueta("");
    setCreandoEtiqueta(false);
  }

  function teclaNuevaEtiqueta(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();   // esto evita que presionar Enter envie todo el formulario
      confirmarNuevaEtiqueta();
    }
  }

  // ............ Envio .............
  async function enviar(evento) {
    evento.preventDefault();
    setError("");

    if (f.codigo === "" || !Number.isInteger(Number(f.codigo)) || Number(f.codigo) < 0) {
      setError("El código debe ser un número entero.");
      return;
    }
    if (duplicado) {
      setError(`El código ${f.codigo} ya pertenece a "${duplicado.titulo}".`);
      return;
    }
    if (f.titulo.trim() === "") {
      setError("El título no puede estar vacío.");
      return;
    }
    if (f.dia === "" || f.mes === "") {
      setError("Elige el día y el mes del vencimiento.");
      return;
    }

    const dia = Number(f.dia);
    const mes = Number(f.mes);
    const anio = Number(f.anio);
    const fecha = new Date(anio, mes - 1, dia);
    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
      setError("La fecha elegida no existe. Revisa el día y el mes.");
      return;
    }
    const vencimiento = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    // Se incluyen etiquetas nuevas incluso si no se presiona "Agregar" al final
    const pendiente = textoEtiqueta.trim().toLowerCase();
    const etiquetasFinales = pendiente && !etiquetas.includes(pendiente)
      ? [...etiquetas, pendiente]
      : etiquetas;

    try {
      setEnviando(true);
      await onCrear({
        tipo: f.tipo,
        codigo: Number(f.codigo),
        titulo: f.titulo.trim(),
        vencimiento,
        prioridad: f.prioridad,
        etiquetas: etiquetasFinales,
        notas: f.notas.trim(),
      });
      onCerrar();
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  const segmentado = (campo, opciones) => (
    <div className="segmentado">
      {opciones.map((op) => (
        <button
          type="button"
          key={op}
          className={f[campo] === op ? "activo" : ""}
          onClick={() => poner(campo, op)}
        >
          {op}
        </button>
      ))}
    </div>
  );

  return (
    <div className="overlay" onClick={onCerrar}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={enviar}>
        <h2>Nueva tarea o proyecto</h2>

        {error && <div className="error">{error}</div>}

        <div className="campo">
          <label>Tipo</label>
          {segmentado("tipo", ["Tarea", "Proyecto"])}
        </div>

        <div className="campo">
          <label htmlFor="codigo">Código</label>
          <input
            id="codigo"
            type="number"
            min="0"
            placeholder="Ej: 12"
            className={duplicado ? "invalido" : ""}
            value={f.codigo}
            onChange={(e) => poner("codigo", e.target.value)}
          />
          {duplicado && (
            <span className="aviso-codigo">
              Este código ya pertenece a "{duplicado.titulo}".
            </span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            placeholder="Ej: Entregar informe"
            value={f.titulo}
            onChange={(e) => poner("titulo", e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Vencimiento</label>
          <div className="fecha-selects">
            <select aria-label="Día" value={f.dia} onChange={(e) => poner("dia", e.target.value)}>
              <option value="">Día</option>
              {DIAS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select aria-label="Mes" value={f.mes} onChange={(e) => poner("mes", e.target.value)}>
              <option value="">Mes</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select aria-label="Año" value={f.anio} onChange={(e) => poner("anio", e.target.value)}>
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="campo">
          <label>Prioridad</label>
          {segmentado("prioridad", ["Alta", "Media", "Baja"])}
        </div>

        <div className="campo">
          <label htmlFor="etiqueta">Etiquetas</label>

          {etiquetas.length > 0 && (
            <div className="etiquetas-elegidas">
              {etiquetas.map((et) => (
                <span key={et} className="etiqueta-elegida">
                  #{et}
                  <button type="button" aria-label={`Quitar ${et}`} onClick={() => quitarEtiqueta(et)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <select id="etiqueta" value="" onChange={cambiarSelectEtiqueta}>
            <option value="">Elegir etiqueta existente...</option>
            {disponibles.map((et) => (
              <option key={et} value={et}>#{et}</option>
            ))}
            <option value={NUEVA}>+ Crear nueva etiqueta...</option>
          </select>

          {creandoEtiqueta && (
            <div className="nueva-etiqueta">
              <input
                autoFocus
                maxLength={30}
                placeholder="Nombre de la nueva etiqueta"
                value={textoEtiqueta}
                onChange={(e) => setTextoEtiqueta(e.target.value)}
                onKeyDown={teclaNuevaEtiqueta}
              />
              <button type="button" className="btn small primary" onClick={confirmarNuevaEtiqueta}>
                Agregar
              </button>
            </div>
          )}
        </div>

        <div className="campo">
          <label htmlFor="notas">Notas</label>
          <textarea
            id="notas"
            rows={3}
            value={f.notas}
            onChange={(e) => poner("notas", e.target.value)}
          />
        </div>

        <div className="acciones-form">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn accent" disabled={enviando}>
            {enviando ? "Guardando..." : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}