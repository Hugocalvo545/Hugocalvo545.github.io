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
      nombre: 'Chaqueta Nike Dri-Fit Form', 
      img: "img/chaquetanike.jpg",
      marca: 'Nike',
      categoria: 'Ropa', 
      deporte: 'Running',
      precio: 12.99,
      descripcion: "Camiseta técnica con tecnología Dri-FIT, ideal para tus entrenamientos más exigentes."
    },
    {
      nombre: 'Nike Dri-FIT ADV Ace', 
      img: "img/viseranike.webp",
      marca: 'Nike',
      categoria: 'Accesorios', 
      deporte: 'Tenis',
      precio: 29.99,
      descripcion: "Visera ligera y transpirable, perfecta para el tenis, con tejido que capilariza el sudor y diseño AeroBill acortado para máxima concentración en el juego."
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
      nombre: 'Balón adidas Real Madrid 2024-2025', 
      img: "img/balonadidas.jpg",
      marca: 'Adidas',
      categoria: 'Accesorios', 
      deporte: 'Baloncesto',
      precio: 39.99,
      descripcion: "Mejora tu juego mientras representas al Real Madrid con este balón adidas 2024-2025, fabricado en caucho resistente y con un diseño que luce las 3 bandas y el escudo del equipo."
    },
    {
      nombre: 'Tenis Adidas Clásicas Swift Run', 
      img: "img/tenisadidas.jpg",
      marca: 'Adidas',
      categoria: 'Calzado', 
      deporte: 'Tenis',
      precio: 99.99,
      descripcion: "Diseñadas para dominar la pista, estas zapatillas de tenis adidas ofrecen sujeción, tracción y comodidad para rendir al máximo en cada punto."
    },
    {
      nombre: 'Camiseta adidas FC Bayern Primera Equipación Authentic 2024-2025', 
      img: "img/bayernadidas.jpg",
      marca: 'Adidas',
      categoria: 'Equipos', 
      deporte: 'Futbol',
      precio: 119.99,
      descripcion: "La camiseta FC Bayern Authentic 2024-2025 combina tradición y rendimiento con un diseño en tonos rojos, detalles termotransferidos y tecnología HEAT.RDY para mantener la frescura en el campo."
    },
    {
    nombre: 'Pantalón largo adidas Essentials 3 Stripes', 
      img: "img/runningadidas.jpg",
      marca: 'Adidas',
      categoria: 'Ropa', 
      deporte: 'Running',
      precio: 29.99,
      descripcion: "Comodidad y estilo se unen en este pantalón adidas de corte clásico, con las icónicas 3 bandas y un diseño versátil ideal para tu día a día."
    },
    {
      nombre: 'Calcetines Jordan Everyday Cushioned Poly Ankle 144 (3 Pares)', 
        img: "img/mediasjordan.jpg",
        marca: 'Jordan',
        categoria: 'Accesorios', 
        deporte: 'Running',
        precio: 19.99,
        descripcion: "Estos calcetines Jordan tobilleros ofrecen transpirabilidad, sujeción y frescura gracias a su tejido que capilariza el sudor y se adapta al puente del pie."
    },
    {
      nombre: 'Pantalón corto Jordan Minnesota Timberwolves Statement Edition', 
        img: "img/pantalonjordan.jpg",
        marca: 'Jordan',
        categoria: 'Ropa', 
        deporte: 'Baloncesto',
        precio: 55.99,
        descripcion: "Luce los colores de los Timberwolves con este pantalón corto Statement Edition, con tejido de malla transpirable y detalles auténticos para rendir en la cancha o destacar en la calle."
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
      nombre: 'Zapatilla Jordan Air Jordan 1 Retro High OG UNC Reimagined Preescolar', 
        img: "img/calzadojordan.jpg",
        marca: 'Jordan',
        categoria: 'Calzado', 
        deporte: 'Baloncesto',
        precio: 89.99,
        descripcion: "Las Air Jordan 1 rinden homenaje a los inicios de MJ en la University of North Carolina, con colores clásicos que celebran el origen de su leyenda."
    },
    {
      nombre: 'Zapatilla Puma PWR Hybrid', 
        img: "img/calzadopuma.jpg",
        marca: 'Puma',
        categoria: 'Calzado', 
        deporte: 'Running',
        precio: 79.99,
        descripcion: "Las zapatillas PUMA combinan tracción, amortiguación y estabilidad con tecnologías como PUMAGRIP, ProFoam y PWRTAPE para un rendimiento potente y preciso en cada paso."
    },
    {
      nombre: 'Conjunto Puma Portugal Segunda Equipación 2024-2025', 
        img: "img/pumaportugal.jpg",
        marca: 'Puma',
        categoria: 'Equipos', 
        deporte: 'Futbol',
        precio: 62.99,
        descripcion: "La segunda equipación de Portugal destaca con un diseño audaz y dinámico, fusionando arte, tecnología y fútbol en una camiseta ideal para el partido o el día a día."
    },
    {
      nombre: 'Pantalón largo Puma teamRISE', 
        img: "img/ropapuma.jpg",
        marca: 'Puma',
        categoria: 'Ropa', 
        deporte: 'Futbol',
        precio: 23.99,
        descripcion: "Estos pantalones de entrenamiento de fútbol para hombre están diseñados para ofrecer la máxima comodidad durante tus sesiones diarias, ya sea con calor o con frío."
    },
    {
      nombre: 'Camiseta Puma Graphics Running Faster', 
        img: "img/camisetapuma.jpg",
        marca: 'Puma',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 19.99,
        descripcion: "La camiseta Puma Graphics Running Faster combina comodidad y rendimiento, con un diseño dinámico y tejido transpirable para mantenerte fresco durante el entrenamiento."
    },
    {
      nombre: 'Gorra armour Armour UA Blitzing', 
        img: "img/gorrounderarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Accesorios', 
        deporte: 'Running',
        precio: 22.99,
        descripcion: "La banda HeatGear® combina protección solar con tecnología que capilariza el sudor, manteniendo la frescura y comodidad gracias a su tejido transpirable y diseño elástico."
    },
    {
      nombre: 'Sudadera Under Armour Rival Fleece Logo Black', 
        img: "img/sudaderaunderarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 39.99,
        descripcion: "La sudadera Under Armour Rival Fleece Logo Black fusiona comodidad y estilo, con un tejido de felpa suave y un diseño clásico con logo bordado para un ajuste cómodo y versátil."
    },
    {
      nombre: 'Zapatillas Under Armour Jet 23', 
        img: "img/calzadounderarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 55.99,
        descripcion: "Ajustadas y listas para el despegue. La mediasuela de Micro G te proporciona la amortiguación que necesitas, mientras que la parte superior resistente resulta ideal dentro y fuera de la cancha."
    },
    {
      nombre: 'Bota Under Armour Magnetico Select 4 FG', 
        img: "img/futbolunderarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Calzado', 
        deporte: 'Futbol',
        precio: 69.99,
        descripcion: "Bota de fútbol Under Amour Magnético Select 4 FG. Botas de gama base elaboradas con piel sintética para campos de césped natural."
    },
    {
      nombre: 'Asics Tennis Wear 24', 
        img: "img/camisetaasics.jpg",
        marca: 'Asics',
        categoria: 'Ropa', 
        deporte: 'Tenis',
        precio: 89.99,
        descripcion: "La camiseta Asics Tennis Wear 24 ofrece ligereza y frescura con su diseño hueco y tejido de secado rápido, pensada para los entusiastas del tenis que buscan rendimiento y comodidad en la pista."
    },
    {
      nombre: 'Asics Wear Australian Open 2024', 
        img: "img/camiseta2asics.jpg",
        marca: 'Asics',
        categoria: 'Ropa', 
        deporte: 'Tenis',
        precio: 109.99,
        descripcion: "La camiseta Asics Wear Australian Open 2024 combina tecnología de secado rápido con un diseño ligero y transpirable, ideal para ofrecer máximo rendimiento y comodidad en los partidos más exigentes del torneo."
    },
    {
      nombre: 'Pantalones cortos Australian Open', 
        img: "img/pantalonasics.jpg",
        marca: 'Asics',
        categoria: 'Ropa', 
        deporte: 'Tenis',
        precio: 84.99,
        descripcion: "La camiseta Asics Wear Australian Open 2024 combina tecnología de secado rápido con un diseño ligero y transpirable, ideal para ofrecer máximo rendimiento y comodidad en los partidos más exigentes del torneo."
    },
    {
      nombre: 'Pro Muñequeras Cortas', 
        img: "img/muñequerasasics.jpg",
        marca: 'Asics',
        categoria: 'Accesorios', 
        deporte: 'Tenis',
        precio: 8.99,
        descripcion: "Asics Pro son las muñequeras de tenis cortas que, gracias al tejido suave, absorben el sudor y garantizan una comodidad inigualable durante todo el partido."    
    },
    {
      nombre: 'Camiseta Nike Chicago Bulls Icon Swingman', 
        img: "img/bullsnike.jpg",
        marca: 'Nike',
        categoria: 'Equipos', 
        deporte: 'Baloncesto',
        precio: 69.99,
        descripcion: "La camiseta Nike Chicago Bulls 2024 une tradición y rendimiento con tecnología Dri-FIT, malla transpirable y detalles oficiales para mantener la frescura dentro y fuera de la cancha."
    },
    {
      nombre: 'Zapatilla Jordan Air Jordan 1 Retro High OG Black And Gold', 
        img: "img/calzado2jordan.jpg",
        marca: 'Jordan',
        categoria: 'Calzado', 
        deporte: 'Baloncesto',
        precio: 114.99,
        descripcion: "Las Air Jordan 1 reinventan el modelo original con una nueva combinación de colores, materiales premium y amortiguación suave, ofreciendo comodidad y homenajeando a las zapatillas que lo empezaron todo."
    },
    {
      nombre: 'Espinillera Puma Ultra Flex Sleeve', 
        img: "img/accesoriospuma.jpg",
        marca: 'Puma',
        categoria: 'Accesorios', 
        deporte: 'Futbol',
        precio: 20.99,
        descripcion: "Las espinilleras PUMA x Fútbol Emotion ULTRA Flex combinan diseño exclusivo y vibrante con ligereza, flexibilidad y resistencia para ofrecerte confianza y protección en cada partido."
    },
    {
      nombre: 'Botas adidas F50 Elite FG Two Horizons', 
        img: "img/botasadidas.jpg",
        marca: 'Adidas',
        categoria: 'Calzado', 
        deporte: 'Futbol',
        precio: 259.99,
        descripcion: "Las botas adidas F50 Elite edición limitada rinde homenaje a Mohamed Salah con diseño en rojo, empeine Fibertouch y suela Sprintframe 360 para velocidad y sujeción explosiva."
    },
    {
      nombre: 'Balón Puma Orbita Laliga 2024-2025 Quality Pro', 
        img: "img/balonpuma.jpg",
        marca: 'Puma',
        categoria: 'Accesorios', 
        deporte: 'Futbol',
        precio: 99.99,
        descripcion: "PUMA y LaLiga presentan el balón 2024/25 con un diseño vibrante que fusiona colores corporativos, arte urbano y pop art, reflejando la pasión y esencia del fútbol en cada toque."
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
      nombre: 'Camiseta Nike Sportswear Just Do It Swoosh', 
        img: "img/camiseta2nike.jpg",
        marca: 'Nike',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 24.99,
        descripcion: "La camiseta Nike Sportswear está confeccionada con algodón para proporcionar comodidad durante todo el día."
    },
    {
      nombre: 'Zapatilla Nike Air Force 1 07', 
        img: "img/airforce.jpg",
        marca: 'Nike',
        categoria: 'Calzado', 
        deporte: 'Running',
        precio: 119.99,
        descripcion: "La Nike Air Force 1 de cuero moderniza un clásico con una unidad Air-Sole y entresuela de espuma para mayor confort y estilo urbano."
    },
    {
      nombre: 'Gorra Nike Club Metal Swoosh', 
        img: "img/gorranike.jpg",
        marca: 'Nike',
        categoria: 'Accesorios', 
        deporte: 'Running',
        precio: 24.99,
        descripcion: "Estilo deportivo con el icónico Swoosh. Esta gorra Nike combina comodidad, frescura y un look impecable gracias a su diseño sin estructura y el logotipo metálico."
    },
    {
      nombre: 'Camiseta Nike Chelsea FC Primera Equipación Authentic 2024-2025', 
        img: "img/chelsea.jpg",
        marca: 'Nike',
        categoria: 'Equipos', 
        deporte: 'Futbol',
        precio: 149.99,
        descripcion: "Inspirada en los profesionales, la camiseta del Chelsea 2024/25 combina tecnología Dri-FIT ADV y diseño auténtico para máxima comodidad y orgullo blue."
    },
    {
      nombre: 'Camiseta Nike Inter Milan Primera Equipación Authentic 2024-2025', 
        img: "img/interdemilan.jpg",
        marca: 'Nike',
        categoria: 'Equipos', 
        deporte: 'Futbol',
        precio: 149.99,
        descripcion: "La camiseta del Inter 2024/25 ofrece el mismo diseño que usan los profesionales, con tecnología Dri-FIT ADV para máxima frescura, comodidad y orgullo nerazzurro."
    },
    {
      nombre: 'Chanclas adidas Adilette', 
        img: "img/chanclasadidas.jpg",
        marca: 'Adidas',
        categoria: 'Accesorios', 
        deporte: 'Running',
        precio: 44.99,
        descripcion: "Icónicas desde 1972, las chanclas Adilette combinan estilo atemporal, comodidad total y un diseño ligero perfecto para el día a día o la piscina."
    },
    {
      nombre: 'Guardaespinilleras adidas Ankle Strap', 
        img: "img/guardaespinilleras.jpg",
        marca: 'Adidas',
        categoria: 'Accesorios', 
        deporte: 'Running',
        precio: 9.99,
        descripcion: "Cinta de cinta autoadherente. Incluye un par de cintas, una cinta para cada pierna ideal para prevenir deslizamientos de la espinillera, llevarla debajo o en la base de la espinillera. Cinta que sustituye al esparadrapo."
    },
    {
      nombre: 'Zapatillas adidas Bounce Legends', 
        img: "img/calzadoadidas.jpg",
        marca: 'Adidas',
        categoria: 'Calzado', 
        deporte: 'Baloncesto',
        precio: 69.99,
        descripcion: "Zapatilla de baloncesto Adidas Bounce Legends con mediasuela Bounce que ofrece amortiguación y impulso para movimientos rápidos. Diseño compacto con las 3 bandas clásicas para potenciar tu juego."
    },
    {
      nombre: 'Sudadera adidas Essentials Big Logo', 
        img: "img/sudaderaadidas.jpg",
        marca: 'Adidas',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 54.99,
        descripcion: "Sudadera adidas de felpa supersuave ideal para entrenar o relajarte, con puños y dobladillo de canalé que ofrecen comodidad y mantienen la temperatura."
    },
    {
      nombre: 'Sudadera adidas Essentials Big Logo', 
        img: "img/realmadrid.jpg",
        marca: 'Adidas',
        categoria: 'Equipo', 
        deporte: 'Futbol',
        precio: 74.99,
        descripcion: "Camiseta adidas Real Madrid blanca con detalles dorados y ¡Hala Madrid! en la nuca. Tejido AEROREADY que mantiene la piel seca y cómoda."
    },
    {
      nombre: 'Camiseta Jordan Jumpman', 
        img: "img/camisetajordan.jpg",
        marca: 'Jordan',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 29.99,
        descripcion: "tá confeccionada con un tejido suave y cómodo, y un ajuste holgado y desenfadado."
    },
    {
      nombre: 'Zapatilla Jordan Air Jordan 1 Retro High OG Midnight Navy', 
        img: "img/calzado3jordan.jpg",
        marca: 'Jordan',
        categoria: 'Calzado', 
        deporte: 'Baloncesto',
        precio: 114.99,
        descripcion: "Las Air Jordan 1 Retro High reinventan un clásico con materiales premium, nuevos colores y texturas, combinando modernidad y estilo atemporal."
    },
    {
      nombre: 'Riñonera Jordan Monogram Camera Bag', 
        img: "img/riñonerajordan.jpg",
        marca: 'Jordan',
        categoria: 'Accesorios', 
        deporte: 'Running',
        precio: 32.99,
        descripcion: "Riñonera Jordan con estampado de monograma Woven, compartimentos con cierre para objetos pequeños y correa regulable y extraíble para mayor versatilidad."
    },
    {
      nombre: 'Pantalón largo Jordan Paris Saint-Germain x Jordan Training 2023-2024', 
        img: "img/pantalon2jordan.jpg",
        marca: 'Jordan',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 55.99,
        descripcion: "Pantalón largo Jordan Paris Saint-Germain Training 2023-2024, diseñado para comodidad y estilo durante el entrenamiento."
    },
    {
      nombre: 'Zapatos de fútbol Puma Future Match FG/AG', 
        img: "img/botaspuma.jpg",
        marca: 'Puma',
        categoria: 'Calzado', 
        deporte: 'Futbol',
        precio: 155.99,
        descripcion: "Bota de fútbol Puma Future Match FG/AG para adultos. Botas sintéticas para utilizar en campos de hierba artificial y hierba natural. Botas de gama media en color Black-Silver."
    },
    {
      nombre: 'Puma Borussia Dortmund Third Kit 2024-2025 Jersey', 
        img: "img/dortmund.jpg",
        marca: 'Puma',
        categoria: 'Equipos', 
        deporte: 'Futbol',
        precio: 94.99,
        descripcion: "Una camiseta con mucha historia. La tercera equipación BVB 24/25 combina elementos de los momentos más históricos del equipo, diseñada para los aficionados más apasionados."
    },
    {
      nombre: 'Sudadera Puma Individualliga 1/4 Zip Top Jr', 
        img: "img/sudadera2puma.jpg",
        marca: 'Puma',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 39.99,
        descripcion: "Sudadera Individualliga 1/4 Zip Top Jr, ideal para entrenar al máximo en frío gracias a su diseño llamativo y ajuste perfecto para tus sesiones diarias."
    },
    {
      nombre: 'Zapatillas Puma Court Pro', 
        img: "img/calzado2puma.jpg",
        marca: 'Puma',
        categoria: 'Calzado', 
        deporte: 'Running',
        precio: 89.99,
        descripcion: "Las Court Pro son zapatillas ideales para jóvenes jugadores, con malla transpirable para comodidad y cuello de tobillo que ofrece protección y estabilidad en la pista."
    },
    {
      nombre: 'Camiseta Under Armour HeatGear Compression LS', 
        img: "img/camisetaunderarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 34.99,
        descripcion: "Camiseta de manga larga HG Comp SS de la marca Under Armour en color White-Black."
    },
    {
      nombre: 'Sudadera Under Armour Rival', 
        img: "img/sudadera2underarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: 59.99,
        descripcion: "Sudadera Under Amour Rival. Confeccionada con material que proporciona rendimiento, reemplaza las viejas sudaderas de algodón. Sorprendentemente ligero, pero a la vez te mantiene en calor."
    },
    {
      nombre: 'Zapatillas Under Armour Curry 12 Dark Energy', 
        img: "img/calzado2underarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Calzado', 
        deporte: 'Running',
        precio: 59.99,
        descripcion: "Sudadera Under Amour Rival. Confeccionada con material que proporciona rendimiento, reemplaza las viejas sudaderas de algodón. Sorprendentemente ligero, pero a la vez te mantiene en calor."
    },
    {
      nombre: 'Mochila Under Armour UA Hustle Lite Backpack (26,5 L)', 
        img: "img/mochilaunderarmour.jpg",
        marca: 'Underarmour',
        categoria: 'Accesorio', 
        deporte: 'Running',
        precio: 34.99,
        descripcion: "Esta mochila Under Armour Hustle Lite de 26,5L cuenta con tecnología Storm que proporciona protección resistente al agua y a las manchas."
    },
    {
      nombre: 'Zapatilla ASICS Gel-1130', 
        img: "img/calzadoasics.jpg",
        marca: 'Asics',
        categoria: 'Calzado', 
        deporte: 'Running',
        precio: 34.99,
        descripcion: "Zapatillas ASICS Gel-1130 con diseño noventero y tecnología GEL, combinan soporte y estilo retro ideal para el uso urbano diario."
    },
    {
      nombre: 'Zapatilla ASICS Gel-1130 beige', 
        img: "img/calzado2asics.jpg",
        marca: 'Asics',
        categoria: 'Calzado', 
        deporte: 'Running',
        precio: 34.99,
        descripcion: "Las zapatillas GEL-NYC combinan estilo retro y moderno, inspiradas en modelos como las GEL-NIMBUS 3 y GEL-CUMULUS 16. Su diseño ofrece gran confort gracias a la tecnología GEL y espumas ligeras."
    },
    {
      nombre: 'Camiseta Asics Seamless SS Top', 
        img: "img/camiseta3asics.jpg",
        marca: 'Asics',
        categoria: 'Ropa', 
        deporte: 'Tenis',
        precio: 49.99,
        descripcion: "Camiseta Asics Seamless SS Top para tenis, diseñada sin costuras para mayor comodidad y libertad de movimiento en la pista. Ideal para entrenamientos intensos."
    },
    {
      nombre: 'Asics Gel-Resolution X Zapatilla', 
        img: "img/calzado3asics.jpg",
        marca: 'Asics',
        categoria: 'Calzado', 
        deporte: 'Tenis',
        precio: 119.99,
        descripcion: "Zapatilla Asics Gel-Resolution X, diseñada para tenis con gran estabilidad, sujeción y tecnología GEL que mejora la amortiguación en cada paso."
    },
    {
      nombre: 'Visera Asics performance visor', 
        img: "img/viseraasics.jpg",
        marca: 'Asics',
        categoria: 'Accesorios', 
        deporte: 'Tenis',
        precio: 29.99,
        descripcion: "Zapatilla Asics Gel-Resolution X, diseñada para tenis con gran estabilidad, sujeción y tecnología GEL que mejora la amortiguación en cada paso."
    },
    /*
    {
      nombre: '', 
        img: "img/runningadidas.jpg",
        marca: 'Adidas',
        categoria: 'Ropa', 
        deporte: 'Running',
        precio: .99,
        descripcion: ""
    },
    */
  ];

  // Función para mostrar productos en el DOM
  function mostrarProductos(productosFiltrados) {
    const contenedor = document.querySelector('.productos-grid');
    contenedor.innerHTML = '';
    // Actualiza el contador de productos filtrados
    const contador = document.getElementById('contador-productos');
    if (contador) {
      contador.textContent = " " + productosFiltrados.length;
    }
    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = '<p>No se encontraron productos que coincidan con el filtro.</p>';
      return;
    }
    
    productosFiltrados.forEach(prod => {
      const div = document.createElement('article');
      div.className = 'producto-card';
      div.innerHTML = `
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
    const categoria  = document.querySelector('.filtros select:nth-of-type(2)').value.toLowerCase();
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
