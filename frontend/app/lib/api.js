const API = "http://127.0.0.1:8000";

async function pedir(ruta, opciones = {}) {
  let res;
  try {
    res = await fetch(`${API}${ruta}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...opciones,
    });
  } catch {
    throw new Error("No se pudo conectar con el backend. ¿Está corriendo en el puerto 8000?");
  }

  if (!res.ok) {
    let mensaje = "Ocurrió un error en el servidor.";
    try {
      const data = await res.json();
      mensaje = typeof data.detail === "string" ? data.detail : "Datos inválidos. Revisa el formulario.";
    } catch {}
    throw new Error(mensaje);
  }
  return res.json();
}

export const api = {
  listar: () => pedir("/tareas"),
  vencidas: () => pedir("/tareas/vencidas"),
  porEtiqueta: (etiqueta) => pedir(`/tareas/etiqueta/${encodeURIComponent(etiqueta)}`),
  buscar: (q) => pedir(`/buscar?q=${encodeURIComponent(q)}`),
  etiquetas: () => pedir("/etiquetas"),
  arbol: () => pedir("/arbol"),
  crear: (datos) => pedir("/tareas", { method: "POST", body: JSON.stringify(datos) }),
  alternar: (codigo) => pedir(`/tareas/${codigo}/completado`, { method: "PATCH" }),
  eliminar: (codigo) => pedir(`/tareas/${codigo}`, { method: "DELETE" }),
  ejemplos: () => pedir("/ejemplos", { method: "POST" }),
};