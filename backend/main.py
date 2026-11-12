import json
from datetime import date, timedelta
from pathlib import Path
from typing import List, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from arbol_tareas import Arbol, Elemento

ARCHIVO = Path(__file__).parent / "tareas.json"

app = FastAPI(title="Gestor de Tareas y Proyectos (ABB)")

# permite que Next.js (puerto 3000) hable con este servidor
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

arbol = Arbol()


# ................ modelo de datos que recibe la API ................
class ElementoEntrada(BaseModel):
    codigo: int
    tipo: Literal["Tarea", "Proyecto"]
    titulo: str = Field(min_length=1)
    vencimiento: date
    prioridad: Literal["Alta", "Media", "Baja"]
    etiquetas: List[str] = []
    notas: str = ""


# ................ Conversion a diccionarios (JSON) ................
def a_dict(e):
    return {
        "codigo": e.codigo,
        "tipo": e.tipo,
        "titulo": e.titulo,
        "vencimiento": e.vencimiento.isoformat(),
        "prioridad": e.prioridad,
        "etiquetas": e.etiquetas,
        "notas": e.notas,
        "completado": e.completado,
        "vencido": e.esta_vencido(),
    }


def nodo_a_dict(nodo):
    """Convierte el árbol completo en un diccionario anidado (recursivo)."""
    if nodo is None:
        return None
    e = nodo.elemento
    if e.completado:
        estado = "completado"
    elif e.esta_vencido():
        estado = "vencido"
    else:
        estado = "pendiente"
    return {
        "codigo": e.codigo,
        "titulo": e.titulo,
        "tipo": e.tipo,
        "estado": estado,
        "izquierdo": nodo_a_dict(nodo.izquierdo),
        "derecho": nodo_a_dict(nodo.derecho),
    }


# ................ guardado en archivo ................
def preorden(nodo, resultado):
    """Raíz, izquierda, derecha. Guardando así, al recargar el árbol
    queda con exactamente la misma forma."""
    if nodo is not None:
        resultado.append(nodo.elemento)
        preorden(nodo.izquierdo, resultado)
        preorden(nodo.derecho, resultado)


def guardar():
    elementos = []
    preorden(arbol.raiz, elementos)
    contenido = json.dumps([a_dict(e) for e in elementos], ensure_ascii=False, indent=2)
    ARCHIVO.write_text(contenido, encoding="utf-8")


def cargar():
    if not ARCHIVO.exists():
        return
    try:
        for d in json.loads(ARCHIVO.read_text(encoding="utf-8")):
            e = Elemento(d["codigo"], d["tipo"], d["titulo"],
                         date.fromisoformat(d["vencimiento"]),
                         d["prioridad"], d["etiquetas"], d["notas"])
            e.completado = d["completado"]
            arbol.insertar(e)
    except (json.JSONDecodeError, KeyError, ValueError):
        print("No se pudo leer tareas.json; se inicia con el árbol vacío.")


cargar()


# ................................................
# ENDPOINTS
# ................................................
@app.get("/tareas")
def listar():
    return [a_dict(e) for e in arbol.recorrer()]


@app.get("/tareas/vencidas")
def vencidas():
    return [a_dict(e) for e in arbol.reporte_vencidas()]


@app.get("/tareas/etiqueta/{etiqueta}")
def por_etiqueta(etiqueta: str):
    return [a_dict(e) for e in arbol.reporte_por_etiqueta(etiqueta)]


@app.get("/buscar")
def buscar(q: str):
    q = q.strip()
    if q.isdigit():
        # busqueda por codigo: usa la busqueda recursiva del ABB
        e = arbol.buscar(int(q))
        return [a_dict(e)] if e else []
    return [a_dict(e) for e in arbol.recorrer(lambda x: q.lower() in x.titulo.lower())]


@app.get("/etiquetas")
def etiquetas():
    return arbol.etiquetas_existentes()


@app.get("/arbol")
def estructura_arbol():
    return {"raiz": nodo_a_dict(arbol.raiz)}


@app.post("/tareas", status_code=201)
def crear(datos: ElementoEntrada):
    titulo = datos.titulo.strip()
    if titulo == "":
        raise HTTPException(status_code=422, detail="El título no puede estar vacío.")
    etiquetas_limpias = [t.strip() for t in datos.etiquetas if t.strip()]
    e = Elemento(datos.codigo, datos.tipo, titulo, datos.vencimiento,
                 datos.prioridad, etiquetas_limpias, datos.notas.strip())
    if not arbol.insertar(e):
        raise HTTPException(status_code=409,
                            detail=f"Ya existe un elemento con el código {datos.codigo}.")
    guardar()
    return a_dict(e)


@app.patch("/tareas/{codigo}/completado")
def alternar_completado(codigo: int):
    e = arbol.buscar(codigo)
    if e is None:
        raise HTTPException(status_code=404, detail="Elemento no encontrado.")
    e.completado = not e.completado
    guardar()
    return a_dict(e)


@app.delete("/tareas/{codigo}")
def eliminar(codigo: int):
    if not arbol.eliminar(codigo):
        raise HTTPException(status_code=404, detail="Elemento no encontrado.")
    guardar()
    return {"ok": True}


@app.post("/ejemplos")
def cargar_ejemplos():
    hoy = date.today()
    ejemplos = [
        Elemento(8, "Proyecto", "Lanzar sitio web", hoy + timedelta(days=30), "Alta",
                 ["web", "trabajo"], "Coordinar diseño y desarrollo."),
        Elemento(3, "Tarea", "Entregar informe", hoy - timedelta(days=10), "Alta",
                 ["universidad"], "Revisar formato IEEE."),
        Elemento(10, "Tarea", "Comprar útiles", hoy + timedelta(days=9), "Baja",
                 ["personal"], ""),
        Elemento(1, "Tarea", "Estudiar para examen", hoy - timedelta(days=3), "Media",
                 ["universidad", "estudio"], "Repasar árboles ABB."),
        Elemento(6, "Proyecto", "Proyecto final de grupo", hoy + timedelta(days=20), "Alta",
                 ["universidad", "trabajo"], "Gestor de tareas con ABB."),
        Elemento(14, "Tarea", "Pagar servicios", hoy + timedelta(days=2), "Media",
                 ["personal"], ""),
        Elemento(4, "Tarea", "Reunión de equipo", hoy + timedelta(days=5), "Media",
                 ["trabajo"], "Definir el reparto de tareas."),
    ]
    for e in ejemplos:
        arbol.insertar(e)   # los codigos repetidos se ignoran
    guardar()
    return {"ok": True}