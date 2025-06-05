let selectedCharacterName = '';
let characters = [];
let currentFaction = null;
let currentSpec = null; 
let currentCategory = null;
let currentSubcat   = null;
let currentTypeSize = null;
let currentType     = null;
// —————— 0. Carrito global y función de guardado ——————
let cart = JSON.parse(localStorage.getItem('cart')) || [];
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}
// —————— 0.1 Saldo simulado de usuario ——————
let userBalance = JSON.parse(localStorage.getItem('userBalance')) || {
  pd: 100,  // 100 puntos de donación iniciales
  pv: 500   // 500 puntos de votación
};
function saveUserBalance() {
  localStorage.setItem('userBalance', JSON.stringify(userBalance));
}
// —————— 0.6 Historial de compras ——————
function saveOrderHistory(totalPD) {
  // Leemos el historial actual o inicializamos vacío
  const history = JSON.parse(localStorage.getItem('orderHistory')) || [];
  // Creamos la entrada con fecha, total y detalles
  const entry = {
    date: new Date().toISOString(),
    totalPD,
    items: cart.map(item => ({ id: item.id, qty: item.qty }))
  };
  history.push(entry);
  localStorage.setItem('orderHistory', JSON.stringify(history));
}

// Para depurar, opcionalmente:
function getOrderHistory() {
  return JSON.parse(localStorage.getItem('orderHistory')) || [];
}
// —————— 0.2 Actualizar contador del carrito ——————
function updateCartCount() {
  const counter = document.getElementById('cart-counter');
  if (!counter) return;
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  counter.textContent = totalItems;
}
// —————— 0.3 Renderizar carrito en la sección de Tienda ——————
async function renderCart() {
  const cartBody = document.getElementById('cart-body');
  if (!cartBody) return;  // Si no estamos en Tienda, salimos
  cartBody.innerHTML = '';
  let total = 0;

  const res = await fetch('api/products.json');
  const products = await res.json();

  cart.forEach(item => {
    const prod = products.find(p => p.id.toString() === item.id);
    if (!prod) return;
    const subtotal = prod.pricePD * item.qty;
    total += subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <a
          href="https://wotlkdb.com/?item=${prod.wowheadId}"
          class="tooltip-item"
          data-item-id="${prod.wowheadId}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="${prod.image}"
            alt="${prod.name}"
            class="cart-item-img card-img-top"
          >
          ${prod.name}
        </a>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-secondary decrease-qty" data-id="${item.id}">−</button>
        ${item.qty}
        <button class="btn btn-sm btn-outline-secondary increase-qty" data-id="${item.id}">+</button>
      </td>
      <td>${prod.pricePD.toFixed(0)} PD</td>
      <td>${subtotal.toFixed(0)} PD</td>
      <td>
        <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">Eliminar</button>
      </td>`;
    cartBody.appendChild(tr);
  });

  document.getElementById('cart-total').textContent = `${total.toFixed(0)} PD`;
}

// Toggle Script con scroll suave y validación de formulario
document.addEventListener('DOMContentLoaded', () => {

    // —————— 1. Toggle de secciones + scroll suave con offset dinámico ——————
    const links    = document.querySelectorAll('[data-target]');
    const sections = document.querySelectorAll('#content-sections > section');

    function showSection(id) {
    sections.forEach(sec =>
        sec.classList.toggle('d-none', sec.id !== id)
    );
    }

    links.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target   = link.dataset.target;
        const scrollId = link.dataset.scroll;

        // 1a) Mostrar la sección correspondiente
        showSection(target);

        // 1b) Scroll suave con offset
        setTimeout(() => {
        const el = scrollId
            ? document.getElementById(scrollId)
            : document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);          
    });
    });

    // Al cargar, mostrar y posicionar 'home'
    showSection('home');
    // Sitúa home sin animación
    setTimeout(() => {
    const home = document.getElementById('home');
    if (home) {
        const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;
        const navHeight  = document.querySelector('.navbar')?.offsetHeight || 0;
        const topPos = home.getBoundingClientRect().top + window.pageYOffset - (heroHeight + navHeight + 20);
        window.scrollTo({ top: topPos, behavior: 'auto' });
    }
    }, 0);

    // —————— 2. Validación del formulario “Crear Cuenta” ——————
    const form = document.getElementById('create-account-form');
    if (form) {
    const pwd = form.password;
    const cpwd = form['confirm-password'];

    // Función para comparar contraseñas
    function validatePasswords() {
        cpwd.setCustomValidity(pwd.value !== cpwd.value ? 'No coinciden' : '');
    }

    pwd.addEventListener('input', validatePasswords);
    cpwd.addEventListener('input', validatePasswords);

    form.addEventListener('submit', e => {
        validatePasswords();
        if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
        }

        e.preventDefault();

        // —————— Registro de cuenta en localStorage ——————
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Verifica si el usuario ya existe
        if (localStorage.getItem(`user_${username}`)) {
        alert('El usuario ya existe. Elige otro nombre.');
        return;
        }

        // Crear el objeto usuario y almacenarlo en localStorage
        const user = { username, password };
        localStorage.setItem(`user_${username}`, JSON.stringify(user));

        alert('Usuario registrado exitosamente!');
        showSection('login'); // Vuelve al login después de registrar
    });
    }    
    // —————— 3. Manejo del formulario “Login” usando SRP ——————
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            e.stopPropagation();

            // 1) Validación de campos HTML5
            if (!loginForm.checkValidity()) {
                loginForm.classList.add('was-validated');
                return;
            }

            // 2) Obtenemos usuario/contraseña
            const username = document.getElementById('login-identifier').value.toUpperCase();
            const password = document.getElementById('login-password').value;

            try {
                // 3) Primera fase SRP: solicitar salt y B al servidor
                const startRes = await fetch(
                    `/api/login/start?username=${encodeURIComponent(username)}`
                );
                if (!startRes.ok) {
                    const err = await startRes.json();
                    alert(err.error || 'Error inicial login');
                    return;
                }
                const { salt, B } = await startRes.json();

                // 4) Inicializar instancia SRP en el cliente
                const client = new jsrp.client();
                client.init({
                    username: username,
                    password: password,
                    salt: salt,
                    serverB: B,
                    hash: 'SHA-1'
                });

                // 5) Obtener A y M1
                const A = client.getPublicKey();
                const M1 = client.getProof();

                // 6) Segunda fase SRP: enviar M1 y A al servidor
                const finishRes = await fetch('/api/login/finish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        A: A,
                        M1: M1
                    })
                });
                if (!finishRes.ok) {
                    const err2 = await finishRes.json();
                    alert(err2.error || 'Error al validar login');
                    return;
                }
                const { M2 } = await finishRes.json();

                // 7) Verificar M2 en el cliente
                const valid = client.checkServerProof(M2);
                if (!valid) {
                    alert('Error de verificación SRP.');
                    return;
                }

                // 8) Login exitoso
                alert('¡Inicio de sesión exitoso!');
                localStorage.setItem('loggedInUser', username);
                document.getElementById('nav-username').textContent = username;
                document.getElementById('user-welcome').textContent = username;
                document.getElementById('nav-login-item').classList.add('d-none');
                document.getElementById('nav-user-item').classList.remove('d-none');
                populateProfileData();
                showSection('profile');

            } catch (err) {
                console.error('Error en login SRP:', err);
                alert('Error interno al intentar iniciar sesión');
            }
        });
    }

    // —————— Actualizar la información de la cuenta ——————
    function populateProfileData() {
    // 1) Datos simulados; en futuro vendrán de API
    const registerDate = '01/01/2025';
    const lastLogin    = '18/05/2025';
    const email        = 'usuario@dominio.com';
    const accountStatus = 'Activo';

    // 2) Actualizar los <span> de la pestaña Información
    document.getElementById('register-date').textContent  = registerDate;
    document.getElementById('last-login').textContent     = lastLogin;
    document.getElementById('user-email').textContent     = email;
    document.getElementById('account-status').textContent = accountStatus;

    // 3) Pedir al servidor la lista real de personajes
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        fetchCharacters(loggedInUser);
    }

    }

    // Función para obtener y mostrar personajes desde el servidor
    async function fetchCharacters(username) {
        try {
            // 1) Llamar al endpoint con el username
            const res = await fetch(`/api/characters?username=${encodeURIComponent(username)}`);
            if (!res.ok) {
                console.error('Error al obtener personajes:', res.statusText);
                return;
            }
            const { characters: charRows } = await res.json();

            // 2) Vaciar el contenedor de personajes
            const container = document.getElementById('character-list');
            container.innerHTML = '';

            // 3) Crear y agregar una tarjeta por cada personaje
            charRows.forEach(char => {
                const wrapper = document.createElement('div');
                wrapper.className = 'col-12 col-md-6';
                wrapper.innerHTML = `
                    <div class="character-card">
                        <div class="card-center">
                            <h4 class="char-name">${char.name}</h4>
                            <p class="char-info">Nivel: <strong>${char.level}</strong></p>
                        </div>
                    </div>`;
                container.appendChild(wrapper);
            });

            // 4) Reconstruir los selectores de personajes para tienda y opciones
            characters = charRows.map(c => ({
                name: c.name,
                raceIcon: '',   // <— si agregas íconos, podrás asignarlos aquí luego
                classIcon: '',
                factionIcon: '',
                faction: ''
            }));
            renderCharacterSelectors();
        } catch (err) {
            console.error('fetchCharacters error:', err);
        }
    }

    function resetShopFilters() {
        currentCategory    = null;
        currentSubcat      = null;
        currentTypeSize    = null;
        currentType        = null;
        currentFaction     = currentFaction; // No tocamos la facción aquí

        // Vaciamos los contenedores y los ocultamos
        document.getElementById('shop-subcategories').innerHTML = '';
        document.getElementById('shop-typesize').innerHTML     = '';
        document.getElementById('shop-type').innerHTML         = '';
        document.getElementById('product-list').innerHTML      = '';

        //document.getElementById('shop-subcategories').style.display = 'none';
        //document.getElementById('shop-typesize').style.display     = 'none';
        //document.getElementById('shop-type').style.display         = 'none';
        //document.getElementById('product-list').style.display      = 'none';
    }
    // —————— 8.1 Rellenar selects de personaje ——————
    function renderCharacterSelectors() {
        // Obtenemos los <select> de Tienda y Opciones
        const shopSel = document.getElementById('char-select-shop');
        const optSel  = document.getElementById('char-select-options');

        // Limpiamos dejando solo la opción por defecto
        shopSel.innerHTML = '<option value="">-- Selecciona uno --</option>';
        optSel.innerHTML  = '<option value="">-- Selecciona uno --</option>';

        // 'characters' proviene de populateProfileData()
        characters.forEach(char => {
            const o1 = document.createElement('option');
            o1.value = char.name;
            o1.textContent = char.name;
            o1.setAttribute('data-faction', char.faction);
            shopSel.appendChild(o1);

            const o2 = document.createElement('option');
            o2.value = char.name;
            o2.textContent = char.name;
            o2.setAttribute('data-faction', char.faction);
            optSel.appendChild(o2);
        });

        // Al cambiar selección, actualizamos el personaje activo
        shopSel.onchange = () => {
            const selectedOption = shopSel.selectedOptions[0];
            currentFaction = selectedOption.getAttribute('data-faction'); // "Horda" / "Alianza"
            selectedCharacterName = shopSel.value;
            document.getElementById('shop-character-name').textContent = selectedCharacterName;
            showSelectedShopCharacterCard();

            // 2) Limpiar filtros previos y mostrar menú de categorías
            resetShopFilters();
            document.getElementById('shop-message').style.display = 'none';
            document.getElementById('shop-categories').style.display = 'flex'; // o 'block', según tu CSS
        };
        optSel.onchange = () => {
            selectedCharacterName = optSel.value;
            document.getElementById('shop-character-name').textContent = selectedCharacterName;
            showSelectedCharacterCard();
        };
    }
    // —————— Mostrar mini-tarjeta en Tienda ——————
    function showSelectedShopCharacterCard() {
        const container = document.getElementById('selected-shop-character-card');
        if (!selectedCharacterName) {
            container.innerHTML = '';
            return;
        }
        // Buscamos en el mismo array 'characters' definido en populateProfileData()
        const char = characters.find(c => c.name === selectedCharacterName);
        if (!char) return;
        container.innerHTML = `
            <div class="mini-card-header">
                <img src="${char.factionIcon}" alt="Facción ${char.faction}" class="mini-faction-icon">
                <img src="${char.raceIcon}" alt="${char.name}" />
                <div class="mini-header-text">
                    <div class="name">${char.name}</div>
                    <p class="mini-level">Nivel: ${char.level}</p>
                    <p class="mini-class"> ${char.class}</p>
                </div>
            <div class="mini-card-body">
            </div>
        `;
    }
    // Muestra la mini-tarjeta del personaje seleccionado
    function showSelectedCharacterCard() {
        const cardContainer = document.getElementById('selected-character-card');
        // Si no hay selección, limpiamos y salimos
        if (!selectedCharacterName) {
            cardContainer.innerHTML = '';
            return;
        }
        // Buscamos el objeto del personaje en el array 'characters'
        const char = characters.find(c => c.name === selectedCharacterName);
        if (!char) return;
        // Creamos el HTML de la mini-tarjeta
        cardContainer.innerHTML = `
            <div class="mini-card-header">
                <img src="${char.factionIcon}" alt="Facción ${char.faction}" class="mini-faction-icon">
                <img src="${char.raceIcon}" alt="${char.name}" />
                <div class="mini-header-text">
                    <div class="name">${char.name}</div>
                    <p class="mini-level">Nivel: ${char.level}</p>
                    <p class="mini-class"> ${char.class}</p>
                </div>
            </div>
            <div class="mini-card-body">
            </div>
        `;
    }

    // —————— 6. Cargar Tienda por Personaje ——————
    async function loadShopForCharacter() {
        // 1) Traer datos
        const res = await fetch('api/products.json');
        const products = await res.json();

        // 2) Preparar contenedor
        const container = document.getElementById('product-list');
        container.innerHTML = ''; // limpiar cualquier tarjeta previa

        // 3) Mostrar nombre de personaje
        document.getElementById('shop-character-name').textContent = selectedCharacterName;

        // 4) Crear y anexar cada tarjeta
        products.forEach(p => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            col.innerHTML = `
                <div class="card h-100 text-center">
                    <a
                      href="https://wotlkdb.com/?item=${p.wowheadId}"
                      class="tooltip-item"
                      data-item-id="${p.id}"
                      data-wid="${p.wowheadId}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src="${p.image}" alt="${p.name}" class="card-img-top">
                    </a>
                    <div class="card-body d-flex flex-column align-items-center">
                        <h5 class="card-title">${p.name}</h5>
                        <strong class="product-price my-2">${(p.pricePD ?? 0).toFixed(0)} PD</strong>
                        <p class="card-text text-center">${p.shortDescription || ''}</p>
                        <button 
                            class="btn btn-success btn-sm add-to-cart mt-auto"
                            data-id="${p.id}"
                        >Añadir al Carrito</button>    
                    </div>
                </div>`;
            container.appendChild(col);
        });
    }

    // 5) Cuando la pestaña Tienda se muestre, recargamos
    document
        .querySelector('[data-bs-target="#shop-tab"]')
        .addEventListener('shown.bs.tab', () => {
            // 1) Limpiar filtros anteriores
            currentCategory  = null;
            currentSubcat    = null;
            currentTypeSize  = null;
            currentType      = null;

            // 2) Limpiar las secciones de subcategorías, tamaños y tipos
            clearSection('shop-subcategories');
            clearSection('shop-typesize');
            clearSection('shop-type');

            // 3) Ocultar productos y mostrar mensaje inicial
            hideProducts();

            // 4) Actualizar carrito
            updateCartCount();
            renderCart();
        });

    // —————— 7. Filtrado por Categoría, Subcategoría, Tamaño y Tipo ——————

    let categoriesData = {};
    let currentCategory, currentSubcat, currentTypeSize, currentType;

    // 7.1 Carga jerarquía de categories.json
    fetch('api/categories.json')
        .then(res => res.json())
        .then(data => {
            console.log('categories.json cargado, keys:', Object.keys(data));
            categoriesData = data;
            console.log('Invocando renderCategories con:', Object.keys(data));
            renderCategories(Object.keys(data));
        })
        .catch(err => console.error('Error cargando categories.json:', err));

    // 7.2 Nivel 1: categorías
    function renderCategories(cats) {
        console.log('renderCategories, cats:', cats);
        const el = document.getElementById('shop-categories');
        el.innerHTML = '';
        cats.forEach(cat => {
            const btn = document.createElement('button');
            btn.textContent = cat;
            btn.className = 'btn btn-outline-primary m-1';
            btn.onclick = () => {
                // 1) Quitar active de todos los botones de nivel 1
                document.querySelectorAll('#shop-categories .btn').forEach(b => {
                    b.classList.remove('active');
                });
                // 2) Marcar este como activo
                btn.classList.add('active');
                // 3) Ejecutar el resto de lógica
                selectCategory(cat);
            }; 
            el.appendChild(btn);
        });
        clearSection('shop-subcategories');
        clearSection('shop-typesize');
        clearSection('shop-type');
        hideProducts();
    }

    // 7.3 Nivel 2: subcategorías (PVE/PVP)
    function selectCategory(cat) {
        console.log('Se hizo clic en categoría:', cat);
        currentCategory = cat;
        console.log('Subcategorías disponibles para este cat:', Object.keys(categoriesData[cat]));
        const subs = Object.keys(categoriesData[cat]);
        const el = document.getElementById('shop-subcategories');
        el.innerHTML = '';
        subs.forEach(sub => {
            const btn = document.createElement('button');
            btn.textContent = sub;
            btn.className = 'btn btn-outline-secondary m-1';
            btn.onclick = () => {
                // 1) Quitar active de todos los botones de nivel 2
                document
                    .querySelectorAll('#shop-subcategories .btn')
                    .forEach(b => b.classList.remove('active'));
                // 2) Marcar este como activo
                btn.classList.add('active');
                // 3) Ejecutar la lógica de filtrado
                selectSubcat(sub);
            };
            el.appendChild(btn);
        });
        clearSection('shop-typesize');
        clearSection('shop-type');
        hideProducts();
    }

    // 7.4 Nivel 3: tamaño de arma
    function selectSubcat(sub) {
        currentSubcat = sub;
        const sizes = Object.keys(categoriesData[currentCategory][sub]);
        const el = document.getElementById('shop-typesize');
        el.innerHTML = '';
        sizes.forEach(size => {
            const btn = document.createElement('button');
            btn.textContent = size;
            btn.className = 'btn btn-outline-success m-1';
            btn.onclick = () => {
                // 1) Quitar active de todos los botones de nivel 3
                document
                    .querySelectorAll('#shop-typesize .btn')
                    .forEach(b => b.classList.remove('active'));
                // 2) Marcar este como activo
                btn.classList.add('active');
                // 3) Ejecutar la lógica de filtrado
                selectTypeSize(size);
            };
            el.appendChild(btn);
        });
        clearSection('shop-type');
        hideProducts();
    }

    // 7.5 Nivel 4: tipo concreto
    function selectTypeSize(size) {
        currentTypeSize = size;
        const node = categoriesData[currentCategory][currentSubcat][size];
        const el = document.getElementById('shop-type');
        el.innerHTML = '';

        if (node && typeof node === 'object' && !Array.isArray(node)) {
            // (1) Manejo de especializaciones
            Object.keys(node).forEach(spec => {
                const btn = document.createElement('button');
                btn.textContent = spec;
                btn.className = 'btn btn-outline-info m-1';
                btn.onclick = () => {
                    document.querySelectorAll('#shop-type .btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentType = spec;
                    renderProducts();
                };
                el.appendChild(btn);
            });
            el.style.display = 'flex';
            hideProducts();
            return;
        }

        // (2) Si node es un array con un solo elemento vacío [""] (p. ej. Brujo), saltamos el botón adicional
        if (Array.isArray(node) && node.length === 1 && node[0] === "") {
            currentType = "";       // asignamos tipo vacío, que coincide con productos de Brujo
            renderProducts();       // mostramos productos de inmediato
            return;                 // salimos sin crear ningún botón
        }

        // (3) Si llegamos aquí, node es un array normal (p. ej. [""]), pero no un caso único (aunque en la práctica ya los cubrimos)
        const types = node;
        types.forEach(tp => {
            const btn = document.createElement('button');
            btn.textContent = tp;
            btn.className = 'btn btn-outline-info m-1';
            btn.onclick = () => {
                document.querySelectorAll('#shop-type .btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentType = tp;
                renderProducts();
            };
            el.appendChild(btn);
        });
        el.style.display = 'flex';
        hideProducts();
    }

    // 7.6 Renderizado final de productos
    async function renderProducts() {
        const res = await fetch('api/products.json');
        const products = await res.json();
        // —————— Guardar catálogo en localStorage para el Checkout ——————
        localStorage.setItem('productsData', JSON.stringify(products));
        const container = document.getElementById('product-list');
        container.innerHTML = '';

        // Filtrado por los cuatro niveles
        let filtered = products
            .filter(p => p.category === currentCategory)
            .filter(p => p.subcategory === currentSubcat)
            .filter(p => p.typeSize === currentTypeSize)
            .filter(p => p.type === currentType)
            .filter(p => {
                if (currentFaction === null) return true;
                return p.faction === currentFaction || p.faction === "Both";
            });
        // Bloque de tarjetas con Wowhead
        filtered.forEach(p => {
            console.log('Producto', p.id, 'pricePD=', p.pricePD);
            const col = document.createElement('div');
            col.className = 'col-md-3 mb-4';
            col.innerHTML = `
                <div class="card h-100 text-center">
                    <a
                      href="https://wotlkdb.com/?item=${p.wowheadId}"
                      class="tooltip-item"
                      data-item-id="${p.id}"
                      data-wid="${p.wowheadId}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src="${p.image}" alt="${p.name}" class="card-img-top">
                    </a>
                    <div class="card-body d-flex flex-column align-items-center">
                        <h5 class="card-title">${p.name}</h5>
                        <strong class="product-price my-2">${(p.pricePD ?? 0).toFixed(0)} PD</strong>
                        <p class="card-text text-center">${p.shortDescription || ''}</p>
                        <button 
                            class="btn btn-success btn-sm add-to-cart mt-auto"
                            data-id="${p.id}"
                        >Añadir al Carrito</button>    
                    </div>
                </div>`;
            container.appendChild(col);
        });

        if (!filtered.length) {
            container.innerHTML = '<p class="text-center text-muted">No hay elementos en esta sección.</p>';
        }

        // Mostrar productos
        document.getElementById('shop-message').style.display = 'none';
        container.style.display = '';
    }

    // —————— Helpers ——————
    function clearSection(id) {
        document.getElementById(id).innerHTML = '';
    }
    function hideProducts() {
        document.getElementById('shop-message').style.display = '';
        document.getElementById('product-list').style.display = 'none';
    }

    // Inicial: ocultar lista hasta selección
    hideProducts();

    // —————— 4. Mantener la sesión activa ——————
    function checkSession() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        // Actualizar el navbar con el nombre de usuario
        document.getElementById('nav-username').textContent = loggedInUser;
        document.getElementById('user-welcome').textContent = loggedInUser;
        document.getElementById('nav-login-item').classList.add('d-none');
        document.getElementById('nav-user-item').classList.remove('d-none');
        // Mostrar directamente el perfil
        populateProfileData();
        showSection('profile');
    } else {
        // Si no hay sesión activa, mostrar la pantalla de inicio de sesión
        showSection('login');
    }
    }
    // Ejecutar la verificación de sesión al cargar la página
    checkSession();

    // —————— 5. Cerrar sesión (Logout) ——————
    document.getElementById('logout').addEventListener('click', e => {
    e.preventDefault();

    // 1) Eliminar el estado de sesión de localStorage
    localStorage.removeItem('loggedInUser');

    // 2) Restaurar el estado inicial del navbar
    document.getElementById('nav-user-item').classList.add('d-none');
    document.getElementById('nav-login-item').classList.remove('d-none');

    // 3) Redirigir a la sección de login
    showSection('login');
    });
    // —————— Manejo de "Mi Cuenta" ——————
    const myAccountBtn = document.getElementById('my-account');
    if (myAccountBtn) {
    myAccountBtn.addEventListener('click', e => {
        e.preventDefault();
        // Mostrar la sección de perfil
        showSection('profile');
    });
    }
    // —————— Manejo de pestañas de "Mi Cuenta" ——————
    document.querySelectorAll('#profile .nav-link').forEach(tab => {
    tab.addEventListener('click', e => {
        e.preventDefault();
        const target = e.currentTarget.getAttribute('href');
        new bootstrap.Tab(e.currentTarget).show();
        // Actualizar la URL sin recargar
        history.pushState(null, '', target);
    });
    });
    // —————— Inicializar visualización de saldo ——————
    document.querySelectorAll('.pd-balance').forEach(el => {
      el.textContent = userBalance.pd;
    });  
    document.querySelectorAll('.pv-balance').forEach(el => {
      el.textContent = userBalance.pv;
    });  
});

// —————— 0.1 Capturar click en “Añadir al carrito” ——————
document.body.addEventListener('click', e => {
    if (e.target.classList.contains('add-to-cart')) {
        const prodId = e.target.dataset.id;
        // Añadir o incrementar cantidad en el carrito
        const existing = cart.find(item => item.id === prodId);
        if (existing) existing.qty += 1;
        else cart.push({ id: prodId, qty: 1 });
        saveCart();
        updateCartCount();
        renderCart();
        // Feedback al usuario
        alert('Producto añadido al carrito');
    }
    else if (e.target.classList.contains('increase-qty')) {
        const id = e.target.dataset.id;
        const item = cart.find(i => i.id === id);
        if (item) {
            item.qty += 1;
            saveCart();
            updateCartCount();
            renderCart();
        }
    }
    else if (e.target.classList.contains('decrease-qty')) {
        const id = e.target.dataset.id;
        const item = cart.find(i => i.id === id);
        if (item && item.qty > 1) {
            item.qty -= 1;
            saveCart();
            updateCartCount();
            renderCart();
        }
    }
    else if (e.target.classList.contains('remove-item')) {
        const id = e.target.dataset.id;
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartCount();
        renderCart();
    }
});
// —————— 0.4 Manejar Checkout ——————
document.getElementById('checkout-btn').addEventListener('click', async () => {
  // 1) Calculamos el total de PD
  let totalPD = cart.reduce((sum, item) => {
    // Encontramos producto
    const prod = JSON.parse(localStorage.getItem('productsData'))
      .find(p => p.id.toString() === item.id);
    return sum + (prod.pricePD * item.qty);
  }, 0);
  // 1.5) Verificar saldo suficiente
  if (totalPD > userBalance.pd) {
    alert('No tienes suficientes PD. Por favor, convierte PV o ajusta tu carrito.');
    return;
  }

  // 2) Confirmación al usuario
  if (!confirm(`Vas a gastar ${totalPD.toFixed(0)} PD. ¿Confirmar compra?`)) return;

  // 3) Guardar en historial (lo haremos en el Paso 3)
  saveOrderHistory(totalPD);

  // 4) Simular compra: vaciar carrito
  cart = [];
  saveCart();
  updateCartCount();
  renderCart();

  // 5) Descontar del saldo del usuario
  userBalance.pd -= totalPD;
  saveUserBalance();
  document.querySelectorAll('.pd-balance').forEach(el => {
  el.textContent = userBalance.pd;
  });
  // 6) Notificar éxito
  alert('¡Compra realizada con éxito! Gracias por tu apoyo.');
  


});

// Script de estado del servidor

async function fetchServerStatus() {
    try {
    const res = await fetch('/api/estado-servidor');
    const data = await res.json();
    document.getElementById('status-indicator')
        .className = `status-dot ${data.status}`;
    document.getElementById('status-text')
        .textContent = data.status === 'online' ? 'En línea' : 'Desconectado';
    document.getElementById('players-info')
        .textContent = `Jugadores en línea: ${data.players}`;
    document.getElementById('uptime-info')
        .textContent = `Uptime: ${data.uptime}`;
    } catch (e) {
    document.getElementById('status-text').textContent = 'Esperando Respuesta';
    }
}
fetchServerStatus();
setInterval(fetchServerStatus, 30000);

//-- Script Citas del día
(function() {
    // Array de citas
    const quotes = [
    { text: "La vida es aquello que te pasa mientras estás ocupado haciendo otros planes.", author: "John Lennon" },
    { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
    { text: "No sueñes tu vida, vive tu sueño.", author: "Mark Twain" },
    { text: "La única forma de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs" },
    { text: "Cree que puedes y ya estás a medio camino.", author: "Theodore Roosevelt" }
    // …añade tantas como quieras
    ];

    const quoteEl = document.getElementById('daily-quote');
    const authorEl = document.getElementById('quote-author');

    function setQuote() {
    const now = new Date();
    // Usa el día del año para indexar el array
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const idx = dayOfYear % quotes.length;
    quoteEl.textContent = `"${quotes[idx].text}"`;
    authorEl.textContent = `— ${quotes[idx].author}`;
    }

    function scheduleNextMidnight() {
    const now = new Date();
    // Calcula ms hasta la próxima medianoche
    const msUntilMidnight = 
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    setTimeout(() => {
        setQuote();
        scheduleNextMidnight(); // reprograma para la siguiente medianoche
    }, msUntilMidnight);
    }

    // Inicialización
    setQuote();
    scheduleNextMidnight();
})();
// Desplazamiento suave al cambiar pestaña en "Mi Cuenta"
document.querySelectorAll('#profile .nav-link').forEach(tab => {
  // Escucha el evento de Bootstrap cuando la pestaña ya está activa
  tab.addEventListener('shown.bs.tab', function (e) {
    // href de la pestaña, por ejemplo "#tab-account"
    const targetId = e.target.getAttribute('href').substring(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      // Desplaza suavemente hasta el inicio del panel de contenido
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});