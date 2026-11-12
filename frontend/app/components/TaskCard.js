"use client";

function formatearFecha(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TaskCard({ tarea, onAlternar, onEliminar }) {
  const estado = tarea.completado ? "completado" : tarea.vencido ? "vencido" : "pendiente";
  const textoEstado = { completado: "Completado", vencido: "Vencido", pendiente: "Pendiente" }[estado];

  return (
    <article
      className={`card prioridad-${tarea.prioridad.toLowerCase()} ${tarea.completado ? "hecha" : ""}`}
    >
      <div className="card-top">
        <span className="tipo">{tarea.tipo}</span>
        <span className="codigo">#{tarea.codigo}</span>
      </div>

      <h3>{tarea.titulo}</h3>
      {tarea.notas && <p className="notas">{tarea.notas}</p>}

      {tarea.etiquetas.length > 0 && (
        <div className="tags">
          {tarea.etiquetas.map((t, i) => (
            <span key={`${t}-${i}`} className="tag">#{t}</span>
          ))}
        </div>
      )}

      <div className="card-meta">
        <span className={`estado ${estado}`}>{textoEstado}</span>
        <span>Vence {formatearFecha(tarea.vencimiento)}</span>
        <span>Prioridad {tarea.prioridad}</span>
      </div>

      <div className="card-actions">
        <button className="btn small" onClick={() => onAlternar(tarea.codigo)}>
          {tarea.completado ? "Reabrir" : "Completar"}
        </button>
        <button className="btn small danger" onClick={() => onEliminar(tarea)}>
          Eliminar
        </button>
      </div>
    </article>
  );
}