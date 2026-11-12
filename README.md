# Gestor de Tareas y Proyectos con Árbol Binario de Búsqueda (ABB)

Aplicación web para organizar tareas y proyectos usando un **Árbol Binario de Búsqueda** implementado desde cero en Python. El backend (Python + FastAPI) contiene toda la lógica del árbol y la interfaz (Next.js) se comunica con él mediante una API REST.

## Características

- Crear tareas y proyectos con código único, fecha de vencimiento, prioridad, etiquetas y notas.
- Eliminar tareas y proyectos (incluye el caso de nodos con dos hijos).
- Buscar por código (búsqueda recursiva en el ABB) o por texto del título.
- Reporte de tareas vencidas.
- Reporte de tareas por etiqueta.
- Marcar tareas como completadas.
- Visualizador gráfico del árbol ABB.
- Modo claro y oscuro.
- Los datos se guardan automáticamente en un archivo JSON.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Estructura de datos | Python (ABB con recursividad) |
| Backend / API | FastAPI + Uvicorn |
| Frontend | Next.js (React) con CSS |

## Estructura del proyecto

```
.
├── backend/
│   ├── arbol_tareas.py   # Clases Elemento, Nodo y Arbol (lógica del ABB)
│   └── main.py           # API REST con FastAPI y guardado en tareas.json
└── frontend/
    └── app/
        ├── page.js       # Página principal
        ├── layout.js
        ├── globals.css   # Estilos y paleta de colores
        ├── lib/api.js    # Comunicación con el backend
        └── components/   # TaskCard, TaskForm, TreeView
```

## Requisitos

- [Python](https://www.python.org/downloads/) 3.8 o superior
- [Node.js](https://nodejs.org/) (versión LTS)

## Instalación y ejecución

Se necesitan **dos terminales abiertas al mismo tiempo**.

### 1. Backend

```bash
cd backend
python -m pip install fastapi "uvicorn[standard]"
python -m uvicorn main:app --reload
```

El servidor queda en `http://127.0.0.1:8000`. La documentación interactiva de la API está en `http://127.0.0.1:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:3000` en el navegador.

> Si la página muestra "No se pudo conectar con el backend", revisa que la primera terminal siga corriendo.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/tareas` | Lista todo en orden ascendente por código (recorrido inorden) |
| GET | `/tareas/vencidas` | Reporte de tareas vencidas |
| GET | `/tareas/etiqueta/{etiqueta}` | Reporte por etiqueta |
| GET | `/buscar?q=...` | Búsqueda por código o por título |
| GET | `/etiquetas` | Etiquetas existentes |
| GET | `/arbol` | Estructura del árbol (para el visualizador) |
| POST | `/tareas` | Crea una tarea o proyecto |
| PATCH | `/tareas/{codigo}/completado` | Marca o desmarca como completada |
| DELETE | `/tareas/{codigo}` | Elimina una tarea o proyecto |
| POST | `/ejemplos` | Carga datos de ejemplo |

## Cómo funciona

1. Cada tarea o proyecto es un nodo del ABB, ordenado por su **código**: los códigos menores van a la izquierda y los mayores a la derecha.
2. Insertar, buscar y eliminar se implementan de forma **recursiva**.
3. El listado y los reportes usan un **recorrido inorden** con filtro, por lo que siempre salen ordenados por código sin usar `sort()`.
4. Después de cada cambio, el backend guarda el árbol en `backend/tareas.json` en **preorden**, para que al reiniciar conserve exactamente la misma forma.
5. El frontend no guarda datos propios: le pide todo al backend y vuelve a consultar después de cada acción.

## Integrantes

- (Agregar nombres)

## Contexto académico

Proyecto final de grupo del curso de estructuras de datos, Técnico Profesional en Desarrollo de Software.