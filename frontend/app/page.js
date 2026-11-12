"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./lib/api";
import TaskCard from "./components/TaskCard";
import TaskForm from "./components/TaskForm";
import TreeView from "./components/TreeView";

export default function Home() {
  const [todas, setTodas] = useState([]);
  const [visibles, setVisibles] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [arbol, setArbol] = useState(null);
  const [vista, setVista] = useState({ tipo: "todas", valor: "" });
  const [pestana, setPestana] = useState("lista");
  const [texto, setTexto] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [tema, setTema] = useState("dark");

  // ............... tema claro / oscuro .............
  useEffect(() => {
    const guardado = localStorage.getItem("tema");
    if (guardado) setTema(guardado);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  // .................... carga de datos desde el backend ....................
  const cargar = useCallback(async () => {
    try {
      const [listaTodas, listaEtiquetas, estructura] = await Promise.all([
        api.listar(),
        api.etiquetas(),
        api.arbol(),
      ]);

      let lista = listaTodas;
      if (vista.tipo === "vencidas") lista = await api.vencidas();
      else if (vista.tipo === "etiqueta") lista = await api.porEtiqueta(vista.valor);
      else if (vista.tipo === "busqueda") lista = await api.buscar(vista.valor);

      setTodas(listaTodas);
      setEtiquetas(listaEtiquetas);
      setArbol(estructura.raiz);
      setVisibles(lista);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [vista]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // .................... acciones ....................
  async function ejecutar(accion) {
    try {
      await accion();
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function crear(datos) {
    await api.crear(datos);   // si falla, el formulario mostrara el error
    await cargar();
  }

  function eliminar(tarea) {
    if (window.confirm(`¿Eliminar "${tarea.titulo}"?`)) {
      ejecutar(() => api.eliminar(tarea.codigo));
    }
  }

  function buscar(evento) {
    evento.preventDefault();
    const q = texto.trim();
    setVista(q === "" ? { tipo: "todas", valor: "" } : { tipo: "busqueda", valor: q });
  }

  // ................. datos derivados ...............
  const total = todas.length;
  const vencidas = todas.filter((t) => t.vencido).length;
  const completadas = todas.filter((t) => t.completado).length;
  const pendientes = total - vencidas - completadas;

  const titulos = {
    todas: "Todos los elementos",
    vencidas: "Reporte: tareas vencidas",
    etiqueta: `Reporte: etiqueta #${vista.valor}`,
    busqueda: `Resultados para "${vista.valor}"`,
  };
  const resaltados = new Set(vista.tipo === "todas" ? [] : visibles.map((t) => t.codigo));

  return (
    <main className="app">
      {/* .......... Encabezado ........... */}
      <header className="topbar">
        <div className="brand">
          <div className="logo">T</div>
          <div>
            <h1>Gestor ABB</h1>
            <p>Gestión de tareas y proyectos con ayuda de árboles binarios de búsqueda"</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn" onClick={() => ejecutar(() => api.ejemplos())}>
            Cargar ejemplos
          </button>
          <button className="btn" onClick={() => setTema(tema === "dark" ? "light" : "dark")}>
            {tema === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>
          <button className="btn accent" onClick={() => setFormAbierto(true)}>
            + Nueva
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {/* ........... estadisticas ........... */}
      <section className="stats">
        <div className="stat"><span>Total</span><strong>{total}</strong></div>
        <div className="stat"><span>Pendientes</span><strong>{pendientes}</strong></div>
        <div className="stat alerta"><span>Vencidas</span><strong>{vencidas}</strong></div>
        <div className="stat"><span>Completadas</span><strong>{completadas}</strong></div>
      </section>

      {/* ........... busqueda y reportes...........*/}
      <section className="toolbar">
        <form className="buscador" onSubmit={buscar}>
          <input
            placeholder="Buscar por código o por título..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button type="submit" className="btn primary">Buscar</button>
        </form>

        <div className="chips">
          <button
            className={`chip ${vista.tipo === "todas" ? "activo" : ""}`}
            onClick={() => { setTexto(""); setVista({ tipo: "todas", valor: "" }); }}
          >
            Todas
          </button>
          <button
            className={`chip alerta ${vista.tipo === "vencidas" ? "activo" : ""}`}
            onClick={() => setVista({ tipo: "vencidas", valor: "" })}
          >
            Vencidas ({vencidas})
          </button>
          {etiquetas.map((et) => (
            <button
              key={et}
              className={`chip ${vista.tipo === "etiqueta" && vista.valor === et ? "activo" : ""}`}
              onClick={() => setVista({ tipo: "etiqueta", valor: et })}
            >
              #{et}
            </button>
          ))}
        </div>
      </section>

      {/* ........... pestañas ........... */}
      <nav className="pestanas">
        <button className={`pestana ${pestana === "lista" ? "activo" : ""}`}
                onClick={() => setPestana("lista")}>
          Lista
        </button>
        <button className={`pestana ${pestana === "arbol" ? "activo" : ""}`}
                onClick={() => setPestana("arbol")}>
          Árbol ABB
        </button>
      </nav>

      {pestana === "lista" ? (
        <>
          <h2 className="titulo-vista">
            {titulos[vista.tipo]} <small>({visibles.length})</small>
          </h2>
          {cargando ? (
            <div className="vacio">Cargando...</div>
          ) : visibles.length === 0 ? (
            <div className="vacio">
              No hay elementos para mostrar. Crea uno con “+ Nueva” o usa “Cargar ejemplos”.
            </div>
          ) : (
            <div className="grid">
              {visibles.map((t) => (
                <TaskCard
                  key={t.codigo}
                  tarea={t}
                  onAlternar={(codigo) => ejecutar(() => api.alternar(codigo))}
                  onEliminar={eliminar}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="titulo-vista">Estructura del árbol</h2>
          <TreeView raiz={arbol} resaltados={resaltados} />
        </>
      )}

      {formAbierto && (
        <TaskForm
          onCerrar={() => setFormAbierto(false)}
          onCrear={crear}
          existentes={todas}
          etiquetasExistentes={etiquetas}
        />
      )}
    </main>
  );
}