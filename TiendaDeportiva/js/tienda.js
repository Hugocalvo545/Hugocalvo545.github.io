let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function actualizarContadorCarrito() {
  const contador = carrito.reduce((acc, prod) => acc + prod.cantidad, 0);
  document.getElementById('carrito-contador').textContent = contador;
}

function agregarAlCarrito(nombre, precio, img) {
  const index = carrito.findIndex(prod => prod.nombre === nombre);
  if (index !== -1) {
    carrito[index].cantidad += 1;
  } else {
    carrito.push({ nombre, precio, img, cantidad: 1 });
  }
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorCarrito();
}

function disminuirCantidad(index) {
  if (carrito[index].cantidad > 1) {
    carrito[index].cantidad -= 1;
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    mostrarCarrito();
  } else {
    eliminarDelCarrito(index);
  }
}

function aumentarCantidad(index) {
  carrito[index].cantidad += 1;
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorCarrito();
  mostrarCarrito();
}

function mostrarCarrito() {
  const modal = document.getElementById('carrito-modal');
  const lista = document.getElementById('carrito-lista');
  const subtotalElement = document.getElementById('carrito-subtotal');
  const ivaElement = document.getElementById('carrito-iva');
  const totalElement = document.getElementById('carrito-total');
  lista.innerHTML = '';
  let suma = 0;
  const ivaPorcentaje = 0.21;

  if (carrito.length === 0) {
    lista.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío</p>';
    subtotalElement.textContent = '0,00 €';
    ivaElement.textContent = '0,00 €';
    totalElement.textContent = '0,00 €';
  } else {
    carrito.forEach((prod, i) => {
      suma += prod.precio * prod.cantidad;
      const div = document.createElement('div');
      div.className = 'carrito-producto';
      div.innerHTML = `
        <div class="producto-img">
          <img src="${prod.img}" alt="${prod.nombre}">
        </div>
        <div class="producto-detalles">
          <h4>${prod.nombre}</h4>
          <span class="precio-unitario">${prod.precio.toFixed(2)} €</span>
        </div>
        <div class="control-cantidad">
          <button class="btn-cantidad" onclick="disminuirCantidad(${i})">−</button>
          <span class="cantidad">${prod.cantidad}</span>
          <button class="btn-cantidad" onclick="aumentarCantidad(${i})">+</button>
        </div>
        <div class="precio-total">
          ${(prod.precio * prod.cantidad).toFixed(2)} €
        </div>
        <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">&times;</button>
      `;
      lista.appendChild(div);
    });
    
    const iva = suma * ivaPorcentaje / (1 + ivaPorcentaje);
    subtotalElement.textContent = (suma - iva).toFixed(2) + ' €';
    ivaElement.textContent = iva.toFixed(2) + ' €';
    totalElement.textContent = suma.toFixed(2) + ' €';
  }
  
  modal.classList.add('activo');
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorCarrito();
  mostrarCarrito();
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarContadorCarrito();

  document.querySelector('.carrito-icono').addEventListener('click', mostrarCarrito);

  document.querySelector('.cerrar-carrito').addEventListener('click', () => {
    document.getElementById('carrito-modal').classList.remove('activo');
  });

  document.getElementById('vaciar-carrito').onclick = () => {
    carrito = [];
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    mostrarCarrito();
  };

  document.getElementById('tramitar-pedido').onclick = () => {
    alert("Gracias por tu compra. Tu pedido será procesado en breve.");
    carrito = [];
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    document.getElementById('carrito-modal').classList.remove('activo');
  };

  document.getElementById('carrito-modal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('activo');
  });
});


document.getElementById('top-ventas-badge').addEventListener('click', function() {
    const seccion = document.getElementById('destacados');
    if (seccion) {
      const y = seccion.getBoundingClientRect().top + window.pageYOffset - 120; // Cambia 120 por el margen que quieras
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
