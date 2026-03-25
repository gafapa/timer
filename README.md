# Timer

Aplicacion web de temporizadores hecha con React, Vite y Mantine.

Permite crear varios temporizadores, guardarlos en el navegador y lanzarlos en una vista grande para usarla en clase, en sesiones de trabajo o en dinamicas rapidas.

## Funciones

- Crear y editar temporizadores con nombre, duracion, color, estilo y sonido.
- Guardar temporizadores en `localStorage`.
- Mostrar el temporizador en pantalla grande.
- Elegir entre varios estilos visuales:
  - reloj digital
  - reloj de arena
  - barra de energia
  - panel numerico
- Reproducir una alarma final con varios sonidos.
- Mantener la alarma sonando en bucle hasta silenciarla.

## Tecnologias

- React 19
- Vite
- Mantine
- Tabler Icons

## Requisitos

- Node.js 18 o superior
- npm

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicacion se abrira normalmente en `http://localhost:5173`.

## Build de produccion

```bash
npm run build
```

## Vista previa de produccion

```bash
npm run preview
```

## Estructura

```text
src/
  App.jsx
  main.jsx
  styles.css
index.html
vite.config.js
```

## Notas

- Los temporizadores se guardan localmente en el navegador.
- La carpeta `dist/` se genera al compilar.
- La carpeta `node_modules/` no se incluye en el repositorio.
