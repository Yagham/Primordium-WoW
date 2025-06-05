// Estadísticas, sockets y hechizos
const STAT_NAMES = { /* … tu mapa de stat_type … */ };
const SOCKET_COLOR = { /* … tu mapa de socketColor … */ };
const SPELL_TRIGGERS = { /* … tu mapa de spelltrigger … */ };

// Función para cargar items.json y enriquecerlos
let itemDataMap = null;
async function loadItemData() {
  if (!itemDataMap) {
    const [resItems, resProducts] = await Promise.all([
      fetch('api/items.json'),
      fetch('api/products.json')
    ]);
    const itemsArr    = await resItems.json();
    const productsArr = await resProducts.json();

    // Mapa de wowheadId → imagen
    const productImageMap = Object.fromEntries(
      productsArr.map(p => [p.wowheadId, p.image])
    );

    // Enriquecer datos
    const enriched = itemsArr.map(i => {
      // Mapear stats
      const stats = [];
      for (let n = 1; n <= 5; n++) {
        const t = i[`stat_type${n}`], v = i[`stat_value${n}`];
        if (t && v) stats.push(`${STAT_NAMES[t] || 'Stat'} +${v}`);
      }
      // Mapear sockets
      const sockets = [];
      for (let n = 1; n <= 3; n++) {
        const c = i[`socketColor_${n}`];
        if (c) sockets.push(SOCKET_COLOR[c]?.name || 'Unknown');
      }
      // Mapear hechizos
      const spells = [];
      for (let n = 1; n <= 3; n++) {
        const sid = i[`spellid_${n}`], trig = i[`spelltrigger_${n}`];
        if (sid && trig) spells.push(`${SPELL_TRIGGERS[trig] || 'Proc'}: #${sid}`);
      }
      return {
        ...i,
        icon: productImageMap[i.id] || '',
        stats,
        sockets,
        spells
      };
    });

    itemDataMap = Object.fromEntries(
      enriched.map(i => [i.id, i])
    );
  }
  return itemDataMap;
}

// Inicializar tooltips con delegación
document.addEventListener('DOMContentLoaded', () => {
  tippy.delegate(document.body, {
    target: '.tooltip-item',
    content: 'Cargando…',
    allowHTML: true,
    interactive: true,
    delay: [200, 50],
    theme: 'light-border',
    onShow: async instance => {
      const ref = instance.reference;
      const wid = ref.getAttribute('data-wid') || ref.getAttribute('data-item-id');
      const map = await loadItemData();
      const d   = map[+wid];
      if (!d) {
        instance.setContent('Información no disponible');
        return;
      }
      // Montar HTML
      let html = `<div class="ttitem q${d.quality}">` +
        `<div class="icon"><img src="${d.icon}" width="32" height="32"></div>` +
        `<div class="info"><strong>${d.name}</strong><br>` +
        `Nivel ${d.itemLevel} (Req. ${d.requiredLevel})<br>`;
      if (d.dmgMin) html += `Daño ${d.dmgMin}–${d.dmgMax} • Vel ${(d.delay/1000).toFixed(2)}<br>`;
      if (d.armor)  html += `Armadura ${d.armor}<br>`;
      d.stats.forEach(s => html += `${s}<br>`);
      if (d.sockets.length) html += `Sockets: ${d.sockets.join(', ')}<br>`;
      d.spells.forEach(sp => html += `${sp}<br>`);
      if (d.description) html += `<hr><small>${d.description}</small>`;
      html += `</div></div>`;
      instance.setContent(html);
    }
  });
});