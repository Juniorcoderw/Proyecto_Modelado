"use strict";

const resumenPruebas = document.getElementById("resumen-pruebas");
const listaPruebas = document.getElementById("lista-pruebas");
const aplicacionPruebas = document.getElementById("aplicacion-pruebas");

function crearActividad(nombre, duracion, predecesoras = []) {
  return {
    nombre,
    descripcion: "",
    predecesoras,
    duracion,
    varianza: 0,
    desviacionEstandar: 0,
    tiempos: null
  };
}

function afirmar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function afirmarCasiIgual(valor, esperado, mensaje) {
  const tolerancia = 1e-9 * Math.max(1, Math.abs(valor), Math.abs(esperado));
  afirmar(Math.abs(valor - esperado) <= tolerancia, mensaje + `: se obtuvo ${valor}`);
}

function registrarResultado(nombre, error = null) {
  const elemento = document.createElement("li");
  elemento.className = error ? "prueba-fallida" : "prueba-correcta";
  const titulo = document.createElement("strong");
  titulo.textContent = (error ? "No superada · " : "Correcta · ") + nombre;
  elemento.append(titulo);
  if (error) {
    const detalle = document.createElement("span");
    detalle.textContent = error.message;
    elemento.append(detalle);
  }
  listaPruebas.append(elemento);
}

function ejecutarPruebas() {
  const calculadora = aplicacionPruebas.contentWindow;
  const pruebas = [
    {
      nombre: "estimación PERT y varianza",
      ejecutar() {
        const estimacion = calculadora.calcularEstimacionPert(2, 4, 6);
        afirmarCasiIgual(estimacion.duracion, 4, "La duración esperada debe ser 4");
        afirmarCasiIgual(estimacion.varianza, 4 / 9, "La varianza debe ser 4/9");
      }
    },
    {
      nombre: "recorridos temprano y tardío",
      ejecutar() {
        const actividades = [
          crearActividad("A", 4),
          crearActividad("B", 5, ["A"]),
          crearActividad("C", 3, ["A"]),
          crearActividad("D", 8, ["B", "C"]),
          crearActividad("E", 4, ["D"]),
          crearActividad("F", 2, ["E"])
        ];
        const solucion = calculadora.resolverProyecto(actividades);
        afirmarCasiIgual(solucion.duracionTotal, 23, "La duración total debe ser 23");
        afirmar(solucion.rutas.length === 1, "Debe existir una ruta crítica");
        afirmar(solucion.rutas[0].join("-") === "A-B-D-E-F", "La ruta crítica no coincide");
        afirmarCasiIgual(solucion.actividadesPorNombre.get("C").holgura, 2, "La holgura de C debe ser 2");
      }
    },
    {
      nombre: "detección de ciclos",
      ejecutar() {
        let detectado = false;
        try {
          calculadora.resolverProyecto([
            crearActividad("A", 1, ["B"]),
            crearActividad("B", 1, ["A"])
          ]);
        } catch (error) {
          detectado = /ciclo/i.test(error.message);
        }
        afirmar(detectado, "El ciclo debe producir un error comprensible");
      }
    },
    {
      nombre: "componentes independientes",
      ejecutar() {
        const solucion = calculadora.resolverProyecto([
          crearActividad("A", 3),
          crearActividad("B", 2, ["A"]),
          crearActividad("C", 4)
        ]);
        afirmarCasiIgual(solucion.duracionTotal, 5, "Debe usarse el final más tardío");
        afirmarCasiIgual(solucion.actividadesPorNombre.get("C").holgura, 1, "C debe tener una unidad de holgura");
      }
    },
    {
      nombre: "rutas críticas paralelas",
      ejecutar() {
        const solucion = calculadora.resolverProyecto([
          crearActividad("A", 2),
          crearActividad("B", 2),
          crearActividad("C", 3, ["A"]),
          crearActividad("D", 3, ["B"])
        ]);
        const rutas = solucion.rutas.map(ruta => ruta.join("-")).sort();
        afirmar(rutas.length === 2, "Deben detectarse dos rutas críticas");
        afirmar(rutas.join("|") === "A-C|B-D", "Las rutas paralelas no coinciden");
      }
    },
    {
      nombre: "probabilidad con varianza cero",
      ejecutar() {
        afirmar(calculadora.calcularProbabilidad(10, 10, 0).probabilidad === 1, "Cumplir el plazo exacto debe dar 100 %");
        afirmar(calculadora.calcularProbabilidad(9, 10, 0).probabilidad === 0, "Un plazo menor debe dar 0 %");
      }
    },
    {
      nombre: "enrutamiento ortogonal de conexiones",
      ejecutar() {
        const ruta = calculadora.crearRutaOrtogonal([
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 30 },
          { x: 50, y: 30 }
        ]);
        afirmar(ruta.startsWith("M 0 0"), "La ruta debe comenzar en el origen");
        afirmar(ruta.includes("Q"), "Los cambios de dirección deben tener esquinas redondeadas");
        afirmar(!ruta.includes("NaN"), "La ruta no debe contener coordenadas inválidas");
      }
    }
  ];

  let correctas = 0;
  pruebas.forEach(prueba => {
    try {
      prueba.ejecutar();
      correctas += 1;
      registrarResultado(prueba.nombre);
    } catch (error) {
      registrarResultado(prueba.nombre, error);
    }
  });

  const total = pruebas.length;
  const superadas = correctas === total;
  resumenPruebas.textContent = `${correctas} de ${total} pruebas superadas.`;
  resumenPruebas.classList.add(superadas ? "pruebas-superadas" : "pruebas-con-fallos");
  document.body.dataset.estado = superadas ? "correcto" : "fallido";
}

aplicacionPruebas.addEventListener("load", ejecutarPruebas, { once: true });
