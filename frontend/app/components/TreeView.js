"use client";

import { useMemo } from "react";

const SEPARACION = 70;   // distancia horizontal entre nodos
const ALTO_NIVEL = 90;   // distancia vertical entre niveles
const MARGEN = 40;
const RADIO = 22;

// Recorrido inorden: la posicion horizontal de cada nodo es su lugar en el
// orden ascendente de codigos, y la vertical es su profundidad en el arbol.
function calcular(raiz) {
  const nodos = [];
  const enlaces = [];
  let contador = 0;
  let maxNivel = 0;

  function recorrer(nodo, nivel) {
    if (!nodo) return null;
    maxNivel = Math.max(maxNivel, nivel);
    const izq = recorrer(nodo.izquierdo, nivel + 1);
    const posicion = {
      ...nodo,
      x: MARGEN + contador * SEPARACION,
      y: MARGEN + nivel * ALTO_NIVEL,
    };
    contador += 1;
    const der = recorrer(nodo.derecho, nivel + 1);
    nodos.push(posicion);
    if (izq) enlaces.push({ de: posicion, a: izq });
    if (der) enlaces.push({ de: posicion, a: der });
    return posicion;
  }

  recorrer(raiz, 0);
  return {
    nodos,
    enlaces,
    ancho: MARGEN * 2 + Math.max(contador - 1, 0) * SEPARACION,
    alto: MARGEN * 2 + maxNivel * ALTO_NIVEL,
  };
}

export default function TreeView({ raiz, resaltados }) {
  const { nodos, enlaces, ancho, alto } = useMemo(() => calcular(raiz), [raiz]);

  if (!raiz) {
    return <div className="vacio">El árbol está vacío. Crea una tarea para ver cómo crece.</div>;
  }

  return (
    <div>
      <div className="arbol-scroll">
        <svg width={ancho} height={alto} role="img" aria-label="Árbol binario de búsqueda">
          {enlaces.map((l, i) => (
            <line key={i} x1={l.de.x} y1={l.de.y} x2={l.a.x} y2={l.a.y} className="enlace" />
          ))}
          {nodos.map((n) => (
            <g
              key={n.codigo}
              className={`nodo ${n.estado} ${resaltados.has(n.codigo) ? "resaltado" : ""}`}
              transform={`translate(${n.x}, ${n.y})`}
            >
              <title>{`${n.titulo} (${n.tipo})`}</title>
              <circle r={RADIO} />
              <text textAnchor="middle" dy="0.35em">{n.codigo}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="leyenda">
        <span><i className="punto pendiente" /> Pendiente</span>
        <span><i className="punto vencido" /> Vencido</span>
        <span><i className="punto completado" /> Completado</span>
        <span><i className="punto resaltado" /> Resultado actual (búsqueda o reporte)</span>
      </div>
    </div>
  );
}