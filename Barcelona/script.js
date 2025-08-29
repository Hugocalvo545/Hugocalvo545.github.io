// Modal
function mostrarModal(titulo, imagen, enlace) {
  document.getElementById("modalTitulo").innerText = titulo;
  document.getElementById("modalImg").src = imagen;
  document.getElementById("linkHotel").href = enlace;
  document.getElementById("modal").style.display = "flex";
}
function cerrarModal() {
  document.getElementById("modal").style.display = "none";
}

// Corazones flotantes
// Crear un corazón
let totalCorazones = 0;   // Total lanzados (contador visible)
let MAX_CORAZONES = 20;   // Máximo en pantalla

function crearCorazon(){
  // Verificar cuántos corazones hay ahora en pantalla
  const corazonesEnPantalla = document.querySelectorAll(".corazon").length;

  if(corazonesEnPantalla >= MAX_CORAZONES) {
    return; // NO añadimos uno nuevo si ya hay demasiados en pantalla
  }

  const corazon = document.createElement("div");
  corazon.classList.add("corazon");
  corazon.innerHTML = "&#x2764;&#xFE0E;";

  // Posición y tamaño aleatorios
  corazon.style.left = Math.random() * window.innerWidth + "px";
  corazon.style.fontSize = Math.random() * 20 + 15 + "px";

  // Duración aleatoria
  let duracion = 5 + Math.random() * 5; 
  corazon.style.animationDuration = duracion + "s";

  document.body.appendChild(corazon);

  // AUMENTAMOS SIEMPRE el contador total
  totalCorazones++;
  document.getElementById("contador-corazones").innerText = "❤ " + totalCorazones;

  // Eliminarlo al terminar la animación
  corazon.addEventListener("animationend", () => {
    corazon.remove();
  });
}

// Lanzar uno nada más abrir
crearCorazon();  

// Seguir lanzando corazones cada 800ms
setInterval(crearCorazon, 800);




