const tipo = document.getElementById("tipo");
const encabezados = document.getElementById("encabezados");
const actividades = document.getElementById("actividades");
const mensaje = document.getElementById("mensaje");
const salida = document.getElementById("salida");

function crearCelda(valor = "", clase = "", tipoEntrada = "text") {
  const celda = document.createElement("td");
  const entrada = document.createElement("input");
  entrada.type = tipoEntrada;
  entrada.value = valor;
  entrada.className = clase;
  if (tipoEntrada === "number") {
    entrada.min = "0";
    entrada.step = "any";
  }
  celda.append(entrada);
  return celda;
}

function agregarActividad(nombre = "", predecesoras = "", tiempos = [1, 1, 1]) {
  const fila = document.createElement("tr");
  fila.append(crearCelda(nombre, "nombre"), crearCelda(predecesoras, "predecesoras"));
  if (tipo.value === "pert") {
    ["optimista", "probable", "pesimista"].forEach((campo, indice) =>
      fila.append(crearCelda(tiempos[indice], campo, "number"))
    );
  } else {
    fila.append(crearCelda(tiempos[1], "tiempo", "number"));
  }
  const celda = document.createElement("td");
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "eliminar";
  boton.textContent = "Quitar";
  boton.addEventListener("click", () => {
    fila.remove();
    ocultarResultados();
  });
  celda.append(boton);
  fila.append(celda);
  actividades.append(fila);
}

function actualizarTabla() {
  const esPert = tipo.value === "pert";
  encabezados.replaceChildren();
  const fila = document.createElement("tr");
  const titulos = esPert
    ? ["Actividad", "Predecesoras", "Optimista", "Probable", "Pesimista", ""]
    : ["Actividad", "Predecesoras", "Duración", ""];
  titulos.forEach(texto => {
    const th = document.createElement("th");
    th.textContent = texto;
    fila.append(th);
  });
  encabezados.append(fila);
  actividades.replaceChildren();
  ocultarResultados();
}

function ocultarResultados() {
  salida.hidden = true;
  mensaje.textContent = "";
}

function leerDatos() {
  const filas = [...actividades.querySelectorAll("tr")];
  if (!filas.length) throw new Error("Agregue al menos una actividad.");
  return filas.map((fila, indice) => {
    const nombre = fila.querySelector(".nombre").value.trim().toUpperCase();
    const predecesoras = fila.querySelector(".predecesoras").value
      .split(",").map(valor => valor.trim().toUpperCase()).filter(Boolean);
    if (!nombre) throw new Error("Asigne un nombre a la actividad de la fila " + (indice + 1) + ".");
    if (new Set(predecesoras).size !== predecesoras.length) {
      throw new Error("La actividad " + nombre + " tiene predecesoras repetidas.");
    }
    let duracion;
    let varianza = 0;
    let tiempos = null;
    if (tipo.value === "pert") {
      const campos = ["optimista", "probable", "pesimista"];
      tiempos = campos.map(campo => {
        const valor = fila.querySelector("." + campo).value;
        return valor === "" ? NaN : Number(valor);
      });
      if (tiempos.some(valor => !Number.isFinite(valor) || valor < 0)) {
        throw new Error("Los tres tiempos de " + nombre + " deben ser números no negativos.");
      }
      const [a, m, b] = tiempos;
      if (a > m || m > b) throw new Error("En " + nombre + " debe cumplirse optimista ≤ probable ≤ pesimista.");
      duracion = (a + 4 * m + b) / 6;
      varianza = ((b - a) / 6) ** 2;
    } else {
      const texto = fila.querySelector(".tiempo").value;
      duracion = texto === "" ? NaN : Number(texto);
      if (!Number.isFinite(duracion) || duracion < 0) {
        throw new Error("La duración de " + nombre + " debe ser un número no negativo.");
      }
    }
    return { nombre, predecesoras, duracion, varianza, tiempos };
  });
}

function resolverProyecto(datos) {
  const porNombre = new Map(datos.map(actividad => [actividad.nombre, actividad]));
  if (porNombre.size !== datos.length) throw new Error("Cada actividad debe tener un nombre único.");
  datos.forEach(actividad => {
    actividad.predecesoras.forEach(nombre => {
      if (!porNombre.has(nombre)) throw new Error("No existe la predecesora " + nombre + " de " + actividad.nombre + ".");
      if (nombre === actividad.nombre) throw new Error("Una actividad no puede precederse a sí misma.");
    });
  });
  const sucesoras = new Map(datos.map(a => [a.nombre, []]));
  const pendientes = new Map(datos.map(a => [a.nombre, a.predecesoras.length]));
  datos.forEach(a => a.predecesoras.forEach(p => sucesoras.get(p).push(a.nombre)));
  const cola = datos.filter(a => pendientes.get(a.nombre) === 0).map(a => a.nombre);
  const orden = [];
  while (cola.length) {
    const nombre = cola.shift();
    orden.push(porNombre.get(nombre));
    sucesoras.get(nombre).forEach(s => {
      pendientes.set(s, pendientes.get(s) - 1);
      if (pendientes.get(s) === 0) cola.push(s);
    });
  }
  if (orden.length !== datos.length) throw new Error("Las precedencias contienen un ciclo. Revise las relaciones.");
  orden.forEach(a => {
    a.inicioTemprano = a.predecesoras.length
      ? Math.max(...a.predecesoras.map(p => porNombre.get(p).finTemprano)) : 0;
    a.finTemprano = a.inicioTemprano + a.duracion;
  });
  const duracionTotal = Math.max(...orden.map(a => a.finTemprano));
  [...orden].reverse().forEach(a => {
    const siguientes = sucesoras.get(a.nombre);
    a.finTardio = siguientes.length
      ? Math.min(...siguientes.map(s => porNombre.get(s).inicioTardio)) : duracionTotal;
    a.inicioTardio = a.finTardio - a.duracion;
    a.holgura = a.inicioTardio - a.inicioTemprano;
    a.critica = Math.abs(a.holgura) < 1e-8;
  });
  return { orden, duracionTotal, sucesoras };
}

function formato(numero) {
  return Number(numero.toFixed(4)).toLocaleString("es-PE", { maximumFractionDigits: 4 });
}

function presentarResultados(datos, solucion) {
  document.getElementById("duracion").textContent = formato(solucion.duracionTotal);
  document.getElementById("criticas").textContent =
    solucion.orden.filter(a => a.critica).map(a => a.nombre).join(", ") || "Ninguna";
  const tabla = document.getElementById("resultados");
  tabla.replaceChildren();
  datos.forEach(a => {
    const fila = document.createElement("tr");
    if (a.critica) fila.className = "critica";
    [a.nombre, a.duracion, a.inicioTemprano, a.finTemprano, a.inicioTardio, a.finTardio, a.holgura, a.critica ? "Sí" : "No"]
      .forEach((valor, indice) => {
        const celda = document.createElement("td");
        celda.textContent = typeof valor === "number" ? formato(valor) : valor;
        fila.append(celda);
      });
    tabla.append(fila);
  });
  const desarrollo = document.getElementById("desarrollo");
  desarrollo.replaceChildren();
  function parrafo(texto) {
    const p = document.createElement("p");
    p.textContent = texto;
    desarrollo.append(p);
  }
  parrafo("Recorrido hacia adelante: el inicio temprano de cada actividad es el mayor fin temprano de sus predecesoras. El fin temprano es inicio temprano + duración.");
  parrafo("Recorrido hacia atrás: desde la duración total, el fin tardío de cada actividad es el menor inicio tardío de sus sucesoras. La holgura es inicio tardío − inicio temprano.");
  if (tipo.value === "pert") {
    parrafo("PERT: duración esperada = (optimista + 4 × probable + pesimista) / 6; varianza = ((pesimista − optimista) / 6)².");
    datos.forEach(a => parrafo(a.nombre + ": (" + a.tiempos[0] + " + 4 × " + a.tiempos[1] + " + " + a.tiempos[2] + ") / 6 = " + formato(a.duracion) + "; varianza = " + formato(a.varianza) + "."));
  }
  parrafo("Las actividades con holgura cero son críticas. Si una actividad crítica se retrasa sin compensaciones, puede retrasar el proyecto. Pueden existir varias rutas críticas.");
  dibujarRed(solucion);
  salida.hidden = false;
}

function dibujarRed(solucion) {
  const contenedor = document.getElementById("red");
  contenedor.replaceChildren();
  const nivel = new Map();
  solucion.orden.forEach(a => nivel.set(a.nombre,
    a.predecesoras.length ? 1 + Math.max(...a.predecesoras.map(p => nivel.get(p))) : 0
  ));
  const niveles = [...new Set(nivel.values())].sort((a,b) => a-b);
  const posicion = new Map();
  const ancho = Math.max(680, niveles.length * 190 + 100);
  let alto = 230;
  niveles.forEach(n => {
    const miembros = solucion.orden.filter(a => nivel.get(a.nombre) === n);
    alto = Math.max(alto, miembros.length * 105 + 85);
    miembros.forEach((a,i) => posicion.set(a.nombre, {
      x: 45 + n * 190,
      y: 45 + i * 105
    }));
  });
  const svgns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgns, "svg");
  svg.setAttribute("viewBox", "0 0 " + ancho + " " + alto);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Diagrama de precedencias del proyecto");
  const definiciones = document.createElementNS(svgns,"defs");
  const marcador = document.createElementNS(svgns,"marker");
  marcador.setAttribute("id","punta");
  marcador.setAttribute("viewBox","0 0 10 10");
  marcador.setAttribute("refX","9");
  marcador.setAttribute("refY","5");
  marcador.setAttribute("markerWidth","6");
  marcador.setAttribute("markerHeight","6");
  marcador.setAttribute("orient","auto-start-reverse");
  const punta = document.createElementNS(svgns,"path");
  punta.setAttribute("d","M 0 0 L 10 5 L 0 10 z");
  punta.setAttribute("fill","#8290a7");
  marcador.append(punta);
  definiciones.append(marcador);
  svg.append(definiciones);
  solucion.orden.forEach(a => a.predecesoras.forEach(p => {
    const anterior = posicion.get(p), actual = posicion.get(a.nombre);
    const linea = document.createElementNS(svgns,"path");
    const x1 = anterior.x + 132, y1 = anterior.y + 25, x2 = actual.x, y2 = actual.y + 25;
    const medio = (x1 + x2) / 2;
    linea.setAttribute("d", "M " + x1 + " " + y1 + " C " + medio + " " + y1 + ", " + medio + " " + y2 + ", " + x2 + " " + y2);
    linea.setAttribute("fill","none");
    linea.setAttribute("stroke","#8290a7");
    linea.setAttribute("stroke-width","2");
    linea.setAttribute("marker-end","url(#punta)");
    svg.append(linea);
  }));
  solucion.orden.forEach(a => {
    const p = posicion.get(a.nombre);
    const rect = document.createElementNS(svgns,"rect");
    rect.setAttribute("x",p.x);
    rect.setAttribute("y",p.y);
    rect.setAttribute("width","132");
    rect.setAttribute("height","50");
    rect.setAttribute("rx","7");
    rect.setAttribute("fill",a.critica ? "#fff0e9" : "#edf3fc");
    rect.setAttribute("stroke",a.critica ? "#d5663b" : "#4c6ca5");
    rect.setAttribute("stroke-width","2");
    svg.append(rect);
    const texto = document.createElementNS(svgns,"text");
    texto.setAttribute("x",p.x + 66);
    texto.setAttribute("y",p.y + 20);
    texto.setAttribute("text-anchor","middle");
    texto.setAttribute("font-size","13");
    texto.setAttribute("font-weight","bold");
    texto.setAttribute("fill","#172033");
    texto.textContent = a.nombre;
    svg.append(texto);
    const tiempo = document.createElementNS(svgns,"text");
    tiempo.setAttribute("x",p.x + 66);
    tiempo.setAttribute("y",p.y + 37);
    tiempo.setAttribute("text-anchor","middle");
    tiempo.setAttribute("font-size","12");
    tiempo.setAttribute("fill","#38465d");
    tiempo.textContent = "t = " + formato(a.duracion);
    svg.append(tiempo);
  });
  contenedor.append(svg);
}

document.getElementById("agregar").addEventListener("click", () => agregarActividad());
document.getElementById("limpiar").addEventListener("click", () => {
  actividades.replaceChildren();
  agregarActividad();
  ocultarResultados();
});
document.getElementById("ejemplo").addEventListener("click", () => {
  actividades.replaceChildren();
  const ejemplo = [
    ["A", "", [2, 3, 4]],
    ["B", "", [3, 5, 7]],
    ["C", "A", [2, 4, 6]],
    ["D", "B", [1, 2, 3]],
    ["E", "C,D", [2, 3, 4]]
  ];
  ejemplo.forEach(a => agregarActividad(...a));
  ocultarResultados();
});
document.getElementById("resolver").addEventListener("click", () => {
  try {
    mensaje.textContent = "";
    const datos = leerDatos();
    const solucion = resolverProyecto(datos);
    presentarResultados(datos, solucion);
  } catch (error) {
    salida.hidden = true;
    mensaje.textContent = error.message;
  }
});
tipo.addEventListener("change", () => {
  actualizarTabla();
  agregarActividad();
});
actualizarTabla();
document.getElementById("ejemplo").click();
