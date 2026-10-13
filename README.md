# Investigación Operativa II — Métodos cuantitativos

Aplicación web académica para resolver y analizar modelos de Investigación Operativa II. El primer módulo desarrollado es PERT–CPM.

## Estado del proyecto

- PERT–CPM: primera versión funcional en desarrollo.
- Inventarios y teoría de decisiones: propuestos para etapas posteriores.
- Validación formal contra los ejercicios y resultados de POM-QM: pendiente.

## Estructura

```text
.
├── index.html
├── estilos.css
├── metodos/
│   └── pert-cpm/
│       ├── index.html
│       ├── estilos.css
│       └── pert-cpm.js
├── Proyecto Modelado/
└── Proyecto_suma/
```

Los directorios `Proyecto Modelado` y `Proyecto_suma` son proyectos anteriores que se conservan sin modificaciones.

## Cómo ejecutar

1. Descargue o clone el repositorio.
2. Abra `index.html` en un navegador moderno.
3. Seleccione el módulo **PERT / CPM**.

También se puede abrir directamente `metodos/pert-cpm/index.html`. La aplicación inicial utiliza HTML, CSS y JavaScript, sin servidor ni dependencias externas.

## Módulo PERT–CPM

### Entradas

- Nombre único de cada actividad.
- Predecesoras inmediatas, separadas por comas.
- CPM: una duración por actividad.
- PERT: tiempos optimista, probable y pesimista.

Los nombres de las actividades no pueden repetirse, las predecesoras deben existir y la red no puede contener ciclos.

### Cálculos

En CPM, el programa utiliza las duraciones ingresadas.

En PERT, calcula para cada actividad:

```text
Tiempo esperado = (optimista + 4 × probable + pesimista) / 6
Varianza = ((pesimista − optimista) / 6)²
```

A partir de la red de precedencias, ejecuta el recorrido hacia adelante y hacia atrás:

```text
Inicio temprano = máximo fin temprano de sus predecesoras
Fin temprano = inicio temprano + duración
Fin tardío = mínimo inicio tardío de sus sucesoras
Inicio tardío = fin tardío − duración
Holgura = inicio tardío − inicio temprano
```

Las actividades sin predecesoras comienzan en el instante cero. Las actividades sin sucesoras terminan, como fecha tardía de referencia, en la duración total del proyecto. Las actividades con holgura cero se clasifican como críticas.

### Resultados

- Duración calculada del proyecto.
- Actividades críticas.
- Tabla con inicios y fines tempranos y tardíos.
- Holgura por actividad.
- Desarrollo de las fórmulas de PERT y explicación de los recorridos.
- Gráfico inicial de precedencias con actividades críticas resaltadas.

## Alcance y limitaciones de esta versión

La red utiliza actividades en nodos (AON). El gráfico organiza las actividades por niveles de precedencia y no pretende ser una copia del diagrama de POM-QM ni del formato de seis casillas utilizado en clase.

La identificación de actividades críticas no equivale todavía a enumerar todas las rutas críticas completas. La versión actual tampoco calcula la probabilidad de terminar antes de una fecha objetivo ni valida sus resultados automáticamente contra POM-QM.

El ejemplo precargado es demostrativo y no corresponde a un ejercicio verificado del docente.

## Organización del código

Cada nuevo método tendrá su propia carpeta con `index.html`, `estilos.css` y un archivo JavaScript propio. Se priorizan identificadores en español y se evitan dependencias o carpetas adicionales mientras no sean necesarias.

## Próximos pasos

1. Validar los cálculos de CPM y PERT con casos de la guía del curso.
2. Mejorar la red para representar nodos de seis casillas y resaltar las rutas críticas completas.
3. Incorporar las probabilidades PERT cuando el ejercicio lo requiera.
4. Verificar la interfaz en distintas resoluciones de pantalla.
5. Continuar con los módulos de inventarios y teoría de decisiones.

## Referencia académica

El desarrollo está orientado a los modelos de gestión de proyectos PERT–CPM trabajados en Investigación Operativa II. La guía de POM-QM del curso se utilizará como referencia para contrastar los procedimientos y resultados, sin atribuir pruebas que todavía no se han ejecutado.
