document.addEventListener('DOMContentLoaded', () => {

  // --- VÁLTOZÓK ÉS DOM ELEMEK ---
  let penalCodeData = [];
  let cart = [];

  // DOM elemek gyors elérése
  const itemList = document.getElementById('item-list');
  const searchInput = document.getElementById('search-input');
  const cartItems = document.getElementById('cart-items');
  const cartPlaceholder = document.getElementById('cart-placeholder');

  // Összesítő elemek
  const summaryFine = document.getElementById('summary-fine');
  const summaryJail = document.getElementById('summary-jail');
  const fineSlider = document.getElementById('fine-slider');
  const jailSlider = document.getElementById('jail-slider');
  const selectedFine = document.getElementById('selected-fine');
  const selectedJail = document.getElementById('selected-jail');

  // Parancs generátor elemek
  const commandOutput = document.getElementById('command-output');
  const copyCommandButton = document.getElementById('copy-command-button');
  const clearCartButton = document.getElementById('clear-cart-button');

  // --- FŐ INDÍTÓ FÜGGVÉNY ---

  // 1. Az app inicializálása
  async function initializeApp() {
    await loadPenalCode();
    prepareData();
    renderItemList();

    setupEventListeners();
  }

  // 2. A JSON adatok betöltése
  async function loadPenalCode() {
    try {
      const response = await fetch('penalcode.json');
      if (!response.ok) {
        throw new Error(`HTTP hiba! Státusz: ${response.status}`);
      }
      // Az eredeti JSON adatokat a 'penalCodeData'-ba töltjük
      penalCodeData = await response.json();
      console.log('Penal Code sikeresen betöltve.');
    } catch (error) {
      console.error('Hiba a Penal Code betöltésekor:', error);
      itemList.innerHTML = '<div class="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded" role="alert">Hiba történt a penalcode.json betöltése közben. Ellenőrizd a konzolt.</div>';
    }
  }

  let allItems = [];

  function prepareData() {
    let idCounter = 0;
    penalCodeData.forEach(kategoria => {
      kategoria.tetelek.forEach(tetel => {
        if (tetel.alpontok && tetel.alpontok.length > 0) {
          tetel.alpontok.forEach(alpont => {
            allItems.push({
              ...alpont,
              id: `item-${idCounter++}`,
              kategoria_nev: kategoria.kategoria_nev,
              fo_tetel_nev: tetel.megnevezes
            });
          });
        } else if (tetel.rovidites) {
          allItems.push({
            ...tetel,
            id: `item-${idCounter++}`,
            kategoria_nev: kategoria.kategoria_nev
          });
        }
      });
    });
    console.log('Adatok előkészítve a kereséshez:', allItems);
  }

  // 3. Tételek renderelése a bal oszlopba
  function renderItemList(itemsToRender = allItems) {
    itemList.innerHTML = '';

    if (itemsToRender.length === 0) {
      itemList.innerHTML = '<p class="text-gray-500 text-center py-4">Nincs a keresésnek megfelelő találat.</p>';
      return;
    }

    // Csoportosítsuk a tételeket kategóriák szerint
    const groupedByKategoria = itemsToRender.reduce((acc, item) => {
      const kategoria = item.kategoria_nev;
      if (!acc[kategoria]) {
        acc[kategoria] = [];
      }
      acc[kategoria].push(item);
      return acc;
    }, {});

    // Hozzuk létre a HTML-t
    for (const kategoriaNev in groupedByKategoria) {
      const kategoriaWrapper = document.createElement('div');
      kategoriaWrapper.className = 'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden';

      kategoriaWrapper.innerHTML = `
                <h2 class="text-xl font-semibold p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer">
                    ${kategoriaNev}
                </h2>
            `;

      // Tételek listája a kategórián belül
      const tetelListaDiv = document.createElement('div');
      tetelListaDiv.className = 'divide-y divide-gray-200 dark:divide-gray-700';

      groupedByKategoria[kategoriaNev].forEach(item => {
        const tetelKartya = document.createElement('div');
        tetelKartya.className = 'p-4 flex justify-between items-start';

        // Tétel adatai (bal oldal)
        let tetelHtml = `
                    <div>
                        <h3 class="text-lg font-medium text-blue-600 dark:text-blue-400">${item.megnevezes}</h3>
                `;

        // Ha alpont, mutassuk a fő tételt is
        if (item.fo_tetel_nev) {
          tetelHtml += `<p class="text-sm text-gray-500 dark:text-gray-400">${item.fo_tetel_nev} (${item.paragrafus})</p>`;
        } else {
          tetelHtml += `<p class="text-sm text-gray-500 dark:text-gray-400">${item.paragrafus}</p>`;
        }

        // Bírság és Fegyház infók
        tetelHtml += `
                        <div class="text-sm mt-1">
                            <span>Bírság: <strong>${formatCurrency(item.min_birsag)} - ${formatCurrency(item.max_birsag)}</strong></span>
                            <span class="ml-4">Fegyház: <strong>${formatJailTime(item.min_fegyhaz)} - ${formatJailTime(item.max_fegyhaz)}</strong></span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-500 mt-1 italic">${item.megjegyzes || ''}</p>
                    </div>
                `;

        // Gombok (jobb oldal)
        const gombokHtml = `
                    <div class="flex-shrink-0 flex flex-col items-end space-y-2 ml-4">
                        <button data-item-id="${item.id}" class="add-to-cart-btn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors">
                            Hozzáadás
                        </button>
                        <button data-item-id="${item.id}" class="toggle-favorite-btn p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                        </button>
                    </div>
                `;

        tetelKartya.innerHTML = tetelHtml + gombokHtml;
        tetelListaDiv.appendChild(tetelKartya);
      });

      kategoriaWrapper.appendChild(tetelListaDiv);
      itemList.appendChild(kategoriaWrapper);
    }
  }

  // 4. Eseménykezelők (Kereső, Gombok...)
  function setupEventListeners() {
    // Kereső eseménykezelője
    // searchInput.addEventListener('keyup', (e) => { ... });

    // Kosár törlése gomb
    // clearCartButton.addEventListener('click', () => { ... });

    // Csúszkák eseménykezelői
    // fineSlider.addEventListener('input', (e) => { ... });
    // jailSlider.addEventListener('input', (e) => { ... });
  }

  // --- SEGÉDFÜGGVÉNYEK ---

  // Pénz formázása
  function formatCurrency(value) {
    if (value === null || value === undefined) return '---';
    return `$${value.toLocaleString('hu-HU')}`;
  }

  // Idő formázása
  function formatJailTime(value) {
    if (value === null || value === undefined) return '---';
    if (typeof value === 'string') return value;
    return `${value} perc`;
  }

  // --- TOVÁBBI FUNKCIÓK (Később implementáljuk) ---

  // function handleSearch() { ... }
  // function addToCart(itemId) { ... }
  // function removeFromCart(cartId) { ... }
  // function updateCartDisplay() { ... }
  // function calculateSummary() { ... }
  // function generateCommands() { ... }
  // function toggleDarkMode() { ... }
  // function toggleFavorites() { ... }
  // function saveToHistory() { ... }
  // function loadFromHistory() { ... }


  // --- ALKALMAZÁS INDÍTÁSA ---
  initializeApp();

});