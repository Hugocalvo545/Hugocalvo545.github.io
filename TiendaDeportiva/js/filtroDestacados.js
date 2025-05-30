document.addEventListener('DOMContentLoaded', function() {
  // Lista de productos (puedes ampliarla)
  const productos = [
    {
      nombre: 'Nike Mercurial Speed 009', 
      img: "img/botasnike.jpg", 
      marca: 'Nike',
      categoria: 'Calzado', 
      deporte: 'Futbol',
      precio: 289.99, 
      descripcion: "Las Nike Mercurial Dream Speed 009 ofrecen velocidad, amortiguación Air Zoom y tracción dinámica para superar a la defensa con facilidad."
    },
    {
      nombre: 'Camiseta Nike Los Angeles Lakers Icon Edition Lebron James', 
      img: "img/lakersnike.jpg",
      marca: 'Nike',
      categoria: 'Equipos', 
      deporte: 'Baloncesto',
      precio: 104.99,
      descripcion: "La camiseta Los Angeles Lakers Icon Edition LeBron James combina tradición y estilo profesional con tejido transpirable, ideal para apoyar a tu equipo y jugar con comodidad."
    },
    {
      nombre: 'Camiseta Jordan Paris Saint-Germain x Jordan Tercera Equipación 2023-2024', 
      img: "img/psgjordan.jpg",
      marca: 'Jordan',
      categoria: 'Equipos', 
      deporte: 'Futbol',
      precio: 59.99,
      descripcion: "La camiseta tercera equipación PSG 2023/24 fusiona el estilo urbano con el fútbol de élite, con el icónico Jordan Elephant Print y tecnología Nike Match para máximo rendimiento y frescura."
    },
    {
      nombre: 'Balón Jordan Basketball 8P Energy Hyper Pink-Black-Black-White', 
        img: "img/balonjordan.jpg",
        marca: 'Jordan',
        categoria: 'Accesorios', 
        deporte: 'Baloncesto',
        precio: 69.99,
        descripcion: "El balón Jordan Basketball 8P Energy destaca por su diseño en Hyper Pink y detalles en negro y blanco, ofreciendo agarre, durabilidad y estilo para dominar la cancha con energía y precisión."
    },
    {
      nombre: 'Zapatilla Jordan Air Jordan 1 Retro High OG UNC Reimagined Preescolar', 
        img: "img/calzadojordan.jpg",
        marca: 'Jordan',
        categoria: 'Calzado', 
        deporte: 'Baloncesto',
        precio: 89.99,
        descripcion: "Las Air Jordan 1 rinden homenaje a los inicios de MJ en la University of North Carolina, con colores clásicos que celebran el origen de su leyenda."
    },
    {
      nombre: 'Botas adidas F50 Elite FG Two Horizons', 
        img: "img/botasadidas.jpg",
        marca: 'Adidas',
        categoria: 'Calzado', 
        deporte: 'Fútbol',
        precio: 259.99,
        descripcion: "Las botas adidas F50 Elite edición limitada rinde homenaje a Mohamed Salah con diseño en rojo, empeine Fibertouch y suela Sprintframe 360 para velocidad y sujeción explosiva."
    },
  ];

  // Función para mostrar productos en el DOM
  function mostrarProductos(productosFiltrados) {
    const contenedor = document.querySelector('.productos-grid');
    contenedor.innerHTML = '';
    
    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = '<p>No se encontraron productos que coincidan con el filtro.</p>';
      return;
    }
    
    productosFiltrados.forEach(prod => {
      const div = document.createElement('article');
      div.className = 'producto-card';
      div.innerHTML = `
        <span class="etiqueta-masvendido">¡Lo más vendido!</span>
        <img src="${prod.img}" alt="${prod.nombre}">
        <div class="producto-info">
          <h3>${prod.nombre}</h3>
          <span class="marca">${prod.marca}</span>
          <span class="categoria">${prod.categoria}</span>
          <span class="deporte">${prod.deporte}</span>
          <p class="precio">${prod.precio.toFixed(2)} €</p>
          <p class="descripcion">${prod.descripcion || ''}</p>
          <button class="btn-primario" onclick="agregarAlCarrito('${prod.nombre}', ${prod.precio}, '${prod.img}')">Añadir al carrito</button>
        </div>
      `;
      contenedor.appendChild(div);
    });
  }

  // Función para filtrar productos
  function filtrarProductos() {
    const inputBusqueda = document.querySelector('.filtros input[type="text"]').value.toLowerCase();
    const marca = document.querySelector('.filtros select:nth-of-type(1)').value.toLowerCase();
    const categoria = document.querySelector('.filtros select:nth-of-type(2)').value.toLowerCase();
    const deporte = document.querySelector('.filtros select:nth-of-type(3)').value.toLowerCase();

    const productosFiltrados = productos.filter(prod => {
      const coincideBusqueda = prod.nombre.toLowerCase().includes(inputBusqueda) || 
                              prod.marca.toLowerCase().includes(inputBusqueda);
      const coincideCategoria = categoria === '' || prod.categoria.toLowerCase() === categoria;
      const coincideDeporte = deporte === '' || prod.deporte.toLowerCase() === deporte;
      const coincideMarca = marca === '' || prod.marca.toLowerCase() === marca;
      return coincideBusqueda && coincideCategoria && coincideDeporte && coincideMarca;
    });

    mostrarProductos(productosFiltrados);
  }

  // Manejo de parámetros de URL
  const urlParams = new URLSearchParams(window.location.search);
  const marcaFiltro = urlParams.get('marca');

  if (marcaFiltro) {
    const selectMarca = document.querySelector('.filtros select:nth-of-type(1)');
    if (selectMarca) {
      selectMarca.value = marcaFiltro.toLowerCase();
      // Filtramos después de que el DOM esté listo
      setTimeout(() => filtrarProductos(), 0);
    }
  }

  // Evento para el formulario de filtros
  const formularioFiltros = document.querySelector('.filtros form');
  if (formularioFiltros) {
    formularioFiltros.addEventListener('submit', e => {
      e.preventDefault();
      filtrarProductos();
    });
  }
  mostrarProductos(productos);
});
