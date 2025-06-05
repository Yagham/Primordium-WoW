// Estadísticas, sockets y hechizos
const STAT_NAMES = {
  3:  'agilidad',
  4:  'fuerza',
  6:  'espíritu',
  7:  'aguante',                 // stat_type2
  5:  'intelecto',               // stat_type3
  12: 'índice de defensa',
  13: 'índice de esquivar',
  14: 'índice de parada',
  15: 'índice de bloqueo con escudo',
  45: 'poder con hechizos',      // stat_type1
  36: 'índice de celeridad',     // stat_type4
  32: 'índice de golpe crítico',  // stat_type5
  31: 'índice de golpe',
  35: 'índice de temple',
  37: 'índice de pericia',
  38: 'poder de ataque',
  44: 'índice de penetración de armadura',
  43: 'regeneración de maná',

};
const SOCKET_COLOR = {
  4: { name: 'Ranura amarilla', cssClass: 'socket-yellow', img:'assets/icons/socket-yellow.png' },  
  2: { name: 'Ranura roja', cssClass: 'socket-red', img:'assets/icons/socket-red.png' },
  1: { name: 'Ranura meta', cssClass: 'socket-meta', img:'assets/icons/socket-meta.png' },
  8: { name: 'Ranura azul', cssClass: 'socket-blue', img:'assets/icons/socket-blue.png' },
  // añade más si necesitas (verde = 2+8 = 10, etc.)
};
// Mapeo de socket bonus: id → descripción
const SOCKET_BONUS = {
  3752: 'Bonus de ranura: +5 poder con hechizos',
  3765: 'Bonus de ranura: +4 índice de penetración de armadura',
  3267: 'Bonus de ranura: +4 índice de celeridad',
  2936: 'Bonus de ranura: +8 poder de ataque',
  2877: 'Bonus de ranura: +4 agilidad',
  2864: 'Bonus de ranura: +4 índice de golpe crítico',
  2873: 'Bonus de ranura: +4 índice de golpe',
  2908: 'Bonus de ranura: +4 índice de golpe',
  3602: 'Bonus de ranura: +7 poder con hechizos',
  3351: 'Bonus de ranura: +6 índice de golpe',
  2892: 'Bonus de ranura: +4 fuerza',
  3357: 'Bonus de ranura: +6 fuerza',
  2890: 'Bonus de ranura: +4 espíritu',
  3764: 'Bonus de ranura: +12 poder de ataque',
  3356: 'Bonus de ranura: +12 poder de ataque',
  3753: 'Bonus de ranura: +9 poder con hechizos',
  3821: 'Bonus de ranura: +8 índice de temple',
  2868: 'Bonus de ranura: +6 aguante',
  2770: 'Bonus de ranura: +7 poder con hechizos',
  2872: 'Bonus de ranura: +5 poder con hechizos',
  3307: 'Bonus de ranura: +9 aguante',
  2927: 'Bonus de ranura: +4 fuerza',
  3312: 'Bonus de ranura: +8 fuerza',
  3305: 'Bonus de ranura: +12 aguante',
  2787: 'Bonus de ranura: +8 índice de golpe crítico',
  3263: 'Bonus de ranura: +4 índice de golpe crítico',
  3600: 'Bonus de ranura: +6 índice de temple',
  3877: 'Bonus de ranura: +16 poder de ataque',
  3355: 'Bonus de ranura: +6 agilidad',
  2843: 'Bonus de ranura: +8 índice de golpe crítico',
  2874: 'Bonus de ranura: +4 índice de golpe crítico',
  3596: 'Bonus de ranura: +5 poder con hechizos',
  2854: 'Bonus de ranura: +3 maná cada 5 s',
  2865: 'Bonus de ranura: +2 maná cada 5 s',
  3313: 'Bonus de ranura: +8 agilidad',
  2952: 'Bonus de ranura: +4 índice de golpe crítico',
  3314: 'Bonus de ranura: +8 índice de golpe crítico',
  3352: 'Bonus de ranura: +8 espíritu',
  2871: 'Bonus de ranura: +4 índice de esquivar',
  3198: 'Bonus de ranura: +5 poder con hechizos',
  // otros bonuses según necesites…
};
// — Mapeo global de ranuras (inventory types) y subclases
const INV_TYPE = {
  1: 'Cabeza',
  3: 'Hombro',
  5: 'Pecho',
  7: 'Piernas',
  20: 'Pecho',
  10: 'Manos',
  13: 'Una mano',
  21: 'Mano derecha',
  22: 'Mano izquierda',
  17: 'Dos manos',
  15: 'A distancia',
  26: 'A distancia',
  25: 'Arrojadiza',

  // … añade aquí todos tus tipos usados …
};
const WEAPON_SUBCLASS = {
  15: 'Daga',
  13: 'Arma de puño',
  0:  'Hacha',
  1:  'Hacha',
  2:  'Arco',
  3:  'Arma de fuego',
  18: 'Ballesta',
  19: 'Varita',
  4:  'Maza',
  5:  'Maza',
  7:  'Espada',
  8:  'Espada',
  6:  'Arma de asta',
  10: 'Bastón',
  16: 'Arrojadizas',
  // … añade tus subclases …
};
const ARMOR_SUBCLASS = {
  1: 'Tela',
  2: 'Cuero',
  3: 'Malla',
  4: 'Placas',

};
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

    // Mapa de wowheadId → producto completo de products.json
    const productMap = Object.fromEntries(
      productsArr.map(p => [p.wowheadId, p])
    );
    // Mapa de wowheadId → ruta de imagen
    const productImageMap = Object.fromEntries(
      productsArr.map(p => [p.wowheadId, p.image])
    );

    // Enriquecer datos
    const enriched = itemsArr.map(i => {
      const bindingText = i.bonding === 1 ? 'Se liga al recogerlo' : '';
      const uniqueText  = i.maxcount === 1 ? 'Único' : '';
      let slotText = INV_TYPE[i.invType] || '';
      if (i.class === 2 && i.subclass) {
        slotText += ' ' + (WEAPON_SUBCLASS[i.subclass] || '');
      }
      if (i.class === 4 && i.subclass) {
        slotText += (ARMOR_SUBCLASS[i.subclass] || '');
      }
      const prod = productMap[i.id] || {};
      // 4) DPS calculado
      const dps = i.dmgMin
        ? ((i.dmgMin + i.dmgMax) / 2) / (i.delay / 1000)
        : 0;
      // — Mapear stats
      const stats = [];
      // Definimos qué tipos van en verde
      const greenTypes = [36, 32, 45, 35, 31, 38, 44, 43, 12, 14, 15, 37, 13, ]; 

      for (let n = 1; n <= 5; n++) {
        const type  = i[`stat_type${n}`];
        const value = i[`stat_value${n}`];
        if (type && value) {
          const name    = STAT_NAMES[type] || `Stat${type}`;
          const isGreen = greenTypes.includes(type);
          let text;

          if (isGreen) {
            // Enchant de poder con hechizos
            if (name === 'poder con hechizos') {
              text = `Equipar: Aumenta el poder con hechizos ${value} p.`;
            }
            // Enchant de poder de ataque
            else if (name === 'poder de ataque') {
              text = `Equipar: Aumenta el poder de ataque ${value} p.`;
            }
            // Enchant de índice de celeridad
            else if (name === 'índice de celeridad') {
              // Factor de conversión rating→% al nivel 80 ≈ 32.877
              const pct = (value / 32.877).toFixed(2);
              text = `Equipar: Mejora tu índice de celeridad ${value} (${pct}% @ L80) p.`;
            }
            // Enchant de índice de golpe crítico
            else if (name === 'índice de golpe crítico') {
              // Factor de conversión rating→% al nivel 80 ≈ 45.91
              const pct = (value / 45.91).toFixed(2);
              text = `Equipar: Mejora tu índice de golpe crítico ${value} (${pct}% @ L80) p.`;
            }
            else if (name === 'índice de temple') {
              // Factor de conversión rating→% al nivel 80 ≈ 94.74 (36 → 0.38%)
              const pct = (value / 94.74).toFixed(2);
              text = `Equipar: Mejora tu índice de temple ${value} (${pct}% @ L80) p.`;
            }
              // Enchant de índice de golpe (hit rating)
            else if (name === 'índice de golpe') {
              // Factor de conversión rating→% al nivel 80 ≈ 32.69 (34 → 1.04%)
              const pct = (value / 32.69).toFixed(2);
              text = `Equipar: Mejora tu índice de golpe ${value} (${pct}% @ L80) p.`;
            }
            // Enchant de índice de penetración de armadura (armor penetration)
            else if (name === 'índice de penetración de armadura') {
              // Factor aproximado de conversión rating→% al nivel 80 ≈ 14.04 (24 → 1.71%)
              const pct = (value / 14.04).toFixed(2);
              text = `Equipar: Aumenta tu índice de penetración de armadura ${value} (${pct}% @ L80) p.`;
            }
            // Enchant de regeneración de maná
            else if (name === 'regeneración de maná' || name === 'Regeneración de poder') {
              // Valor base value → “cada 5 s.” fijo
              text = `Equipar: Restaura ${value} p. de maná cada 5 s.`;
            }
            // Enchant de índice de defensa (defense rating)
            else if (name === 'índice de defensa') {
              // Factor aproximado rating→% al nivel 80 ≈ 4.92 (27 → 5.49%)
              const pct = (value / 4.92).toFixed(2);
              text = `Equipar: Aumenta tu índice de defensa ${value} (${pct}% @ L80) p.`;
            }
            // Enchant de índice de parada (parry rating)
            else if (name === 'índice de parada') {
              // Factor aproximado rating→% al nivel 80 ≈ 45.65 (21 → 0.46%)
              const pct = (value / 45.65).toFixed(2);
              text = `Equipar: Aumenta tu índice de parada ${value} (${pct}% @ L80) p.`;
            }
            // Enchant de índice de bloqueo con escudo (shield block rating)
            else if (name === 'índice de bloqueo con escudo') {
              // Factor aproximado rating→% al nivel 80 ≈ 16.44 (31 → 1.89%)
              const pct = (value / 16.44).toFixed(2);
              text = `Equipar: Aumenta tu índice de bloqueo con escudo ${value} (${pct}% @ L80) p.`;
            }
            // Enchant de índice de pericia (expertise rating)
            else if (name === 'índice de pericia') {
              // Factor aproximado rating→% al nivel 80 ≈ 8.19 (34 → 4.15%)
              const pct = (value / 8.19).toFixed(2);
              text = `Equipar: Aumenta tu índice de pericia ${value} (${pct}% @ L80) p.`;
            }
            // Enchant de índice de esquivar (dodge rating)
            else if (name === 'índice de esquivar') {
              // Factor aproximado rating→% al nivel 80 ≈ 45.91 (25 → 0.55%)
              const pct = (value / 45.91).toFixed(2);
              text = `Equipar: Aumenta tu índice de esquivar ${value} (${pct}% @ L80) p.`;
            }
            // Otros enchants verdes genéricos
            else {
              text = `Equipar: ${name.toLowerCase()} ${value} p.`;
            }
          } else {
            // Stats blancos sin cambio
            text = `+${value} ${name}`;
          }

          stats.push({ text, isGreen });
        }
      }
      // Mapear sockets
      const sockets = [];
      for (let n = 1; n <= 3; n++) {
        const col = i[`socketColor_${n}`];
        if (col && SOCKET_COLOR[col]) {
          sockets.push(SOCKET_COLOR[col]);
        }
      }
      // Mapear hechizos
      const spells = [];
      for (let n = 1; n <= 3; n++) {
        const sid  = i[`spellid_${n}`];
        const trig = i[`spelltrigger_${n}`];
        if (sid && trig) spells.push(`${SPELL_TRIGGERS[trig] || 'Proc'}: Hechizo #${sid}`);
      }
      return {
        ...i,
        // Usamos el nombre en español definido en products.json
        name: prod.name || i.name,
        icon: productImageMap[i.id] || '',
        bindingText,
        uniqueText,
        slotText,
        dps: dps.toFixed(1),
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
      const sockets = d.sockets;
      if (!d) {
        instance.setContent('Información no disponible');
        return;
      }
      // Montar HTML del tooltip
      let html = `<div class="ttitem q${d.quality}">`;

      // — Header: icono, nombre, binding y unique
      html += `
        <div class="tt-header">
          <div class="tt-title-full">
            ${d.name}
          </div>
          ${d.bindingText ? `<div class="tt-binding">${d.bindingText}</div>` : ''}
          ${d.uniqueText  ? `<div class="tt-unique">${d.uniqueText}</div>`   : ''}
        </div>`;

      // — Stats principales: slot, daño, DPS, durabilidad
      html += `<div class="tt-main-stats">`;

      html += `
        <div class="tt-slot">
          <span class="tt-slot-left">${INV_TYPE[d.invType] || 'Desconocido'}</span>
          <span class="tt-slot-right">${
            d.class === 2
              ? (WEAPON_SUBCLASS[d.subclass] || 'Desconocido')
              : d.class === 4
              ? (ARMOR_SUBCLASS[d.subclass]  || 'Desconocido')
              : 'Desconocido'
          }</span>
        </div>`;

      if (d.class === 2 && d.dmgMin) {
        html += `
          <div class="tt-dmg-speed">
            <span class="tt-dps-left">${d.dmgMin} - ${d.dmgMax} Daño</span>
            <span class="tt-dps-right">Veloc. ${(d.delay/1000).toFixed(2)}</span>
          </div>`;
      }
      
      // — Armadura (solo si existe el campo d.armor)
      if (d.armor) {
        html += `<div class="tt-line">${d.armor} armadura</div>`;
      }


      // DPS
      if (d.class === 2 && d.dps) {
        html += `<div class="tt-line">(${d.dps} daño por segundo)</div>`;
      }
      html += `</div>`;
      
      // — Stats blancos
      const whiteStats = d.stats.filter(s => !s.isGreen);
      if (whiteStats.length) {
        html += `<div class="tt-extra-stats">`;
        whiteStats.forEach(s => {
          html += `<div class="tt-line">${s.text}</div>`;
        });
        html += `</div>`;
      }

      // — Sockets
      if (sockets.length) {
        html += `<div class="socket-list">`;
          sockets.forEach((s, idx) => {
            // Cada socket en un contenedor con clase .socket-item
            html += `<span class="socket-item">`;
            html += `  <img src="${s.img}" alt="${s.name}" class="socket-img" title="${s.name}">`;
            html += `  <span class="socket-text">${s.name}</span>`;
            html += `</span>`;
            // Tras el primer socket, forzamos salto de línea
            if (idx === 0 && sockets.length > 1) {
              html += `<br>`;
            }
          });
          html += `</div>`;
      }

      // — Socket Bonus
      if (d.socketBonus && SOCKET_BONUS[d.socketBonus]) {
        html += `<div class="socket-bonus">${SOCKET_BONUS[d.socketBonus]}</div>`;
      }

      // — Footer: requisitos
      html += `<div class="tt-footer">`;
      if (d.allowedClasses && d.allowedClasses.length) {
        // Envolvemos cada nombre en <span class="cls-<Nombre>">Nombre</span>
        const colored = d.allowedClasses
          .map(c => {
            const safe = c.replace(/\s+/g, '-'); 
            // Ejemplo: "Caballero de la Muerte" → "Caballero-de-la-Muerte"
            return `<span class="cls-${safe}">${c}</span>`;
          })
          .join(', ');
        html += `Clases: ${colored}<br>`;
      }
      html += `
        Necesitas ser de nivel ${d.requiredLevel}<br>
        Nivel de objeto ${d.itemLevel}
      </div>`;
      
      // — Stats verdes
      const greenStats = d.stats.filter(s => s.isGreen);
      if (greenStats.length) {
        html += `<div class="tt-extra-stats">`;
        greenStats.forEach(s => {
          html += `<div class="tt-line tt-green">${s.text}</div>`;
        });
        html += `</div>`;
      }


      // — Hechizos/procs
      if (d.spells.length) {
        html += `<div class="tt-spells">`;
        d.spells.forEach(sp => html += `${sp}<br>`);
        html += `</div>`;
      }

      // — Descripción lore
      if (d.description) {
        html += `<hr><div class="tt-desc"><small>${d.description}</small></div>`;
      }
      // — Info de conjunto para Atavío de Gul'dan (itemset 845)
      if (d.itemset === 845) {
        html += `
          <div class="tt-set-title">Atavío de Gul'dan (0/5)</div>
          <div class="tt-set-piece">Hombreras de conquista de Gul'dan</div>
          <div class="tt-set-piece">Toga de conquista de Gul'dan</div>
          <div class="tt-set-piece">Leotardos de conquista de Gul'dan</div>
          <div class="tt-set-piece">Caperuza de conquista de Gul'dan</div>
          <div class="tt-set-piece">Guantes de conquista de Gul'dan</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta un 10% la probabilidad de que tu mascota aseste un golpe crítico con todos sus ataques.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 10% el daño infligido por tus hechizos Inmolar, Corrupción y Aflicción inestable.</div>
        `;
      }
      if (d.itemset === 846) {
        html += `
          <div class="tt-set-title">Atavío de Kel'Thuzad (0/5)</div>
          <div class="tt-set-piece">Hombreras de conquista de Kel'Thuzad</div>
          <div class="tt-set-piece">Toga de conquista de Kel'Thuzad</div>
          <div class="tt-set-piece">Leotardos de conquista de Kel'Thuzad</div>
          <div class="tt-set-piece">Caperuza de conquista de Kel'Thuzad</div>
          <div class="tt-set-piece">Guantes de conquista de Kel'Thuzad</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta un 10% la probabilidad de que tu mascota aseste un golpe crítico con todos sus ataques.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 10% el daño infligido por tus hechizos Inmolar, Corrupción y Aflicción inestable.</div>
        `;
      }
      if (d.itemset === 780) { 
        html += `
          <div class="tt-set-title">Sayo vil de Gladiador (0/5)</div>
          <div class="tt-set-piece">Capucha de tejido vil de Gladiador furioso</div>
          <div class="tt-set-piece">Vestimenta de tejido vil de Gladiador furioso</div>
          <div class="tt-set-piece">Calzas de tejido vil de Gladiador furioso</div>
          <div class="tt-set-piece">Amito de tejido vil de Gladiador furioso</div>
          <div class="tt-set-piece">Manoplas de tejido vil de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de lanzamiento de tu hechizo Miedo 0.2 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 872) {  // Reemplaza YYY con el ID de tu conjunto “Equipo de batalla de Koltira” en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Koltira (0/5)</div>
          <div class="tt-set-piece">Placa de batalla de conquista de Koltira</div>
          <div class="tt-set-piece">Guanteletes de conquista de Koltira</div>
          <div class="tt-set-piece">Casco de conquista de Koltira</div>
          <div class="tt-set-piece">Quijotes de conquista de Koltira</div>
          <div class="tt-set-piece">Hombreras de placas de conquista de Koltira</div>
          <div class="tt-set-bonus">(2) Bonif.: Tus facultades Golpe sangriento y Golpe en el corazón tienen una probabilidad de otorgarte 180 p. de fuerza extra durante 15 seg.</div>
          <div class="tt-set-bonus">(4) Bonif.: Tu facultad Peste de sangre ahora tiene la probabilidad de infligir golpes críticos con su daño.</div>
        `;
      }
      if (d.itemset === 874) {  // Reemplaza ZZZ con el ID de tu conjunto "Placas de Koltira" en tu base de datos
        html += `
          <div class="tt-set-title">Placas de Koltira (0/5)</div>
          <div class="tt-set-piece">Coselete de conquista de Koltira</div>
          <div class="tt-set-piece">Manoplas de conquista de Koltira</div>
          <div class="tt-set-piece">Visera de conquista de Koltira</div>
          <div class="tt-set-piece">Musleras de conquista de Koltira</div>
          <div class="tt-set-piece">Espaldares de conquista de Koltira</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Orden oscura 2 s y aumenta un 5% el daño infligido por tus facultades Golpe sangriento y Golpe en el corazón.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tus facultades Armadura inquebrantable, Sangre vampírica y Escudo óseo 10 s.</div>
        `;
      }
      if (d.itemset === 873) {  // Reemplaza AAA con el ID de tu conjunto "Placas de Thassarian" en la base de datos
        html += `
          <div class="tt-set-title">Placas de Thassarian (0/5)</div>
          <div class="tt-set-piece">Visera de conquista de Thassarian</div>
          <div class="tt-set-piece">Coselete de conquista de Thassarian</div>
          <div class="tt-set-piece">Musleras de conquista de Thassarian</div>
          <div class="tt-set-piece">Espaldares de conquista de Thassarian</div>
          <div class="tt-set-piece">Manoplas de conquista de Thassarian</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Orden oscura 2 s y aumenta un 5% el daño infligido por tus facultades Golpe sangriento y Golpe en el corazón.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tus facultades Armadura inquebrantable, Sangre vampírica y Escudo óseo 10 s.</div>
        `;
      }
      if (d.itemset === 871) {  // Reemplaza BBB con el ID de tu conjunto "Equipo de batalla de Thassarian" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Thassarian (0/5)</div>
          <div class="tt-set-piece">Casco de conquista de Thassarian</div>
          <div class="tt-set-piece">Placa de batalla de conquista de Thassarian</div>
          <div class="tt-set-piece">Quijotes de conquista de Thassarian</div>
          <div class="tt-set-piece">Hombreras de placas de conquista de Thassarian</div>
          <div class="tt-set-piece">Guanteletes de conquista de Thassarian</div>
          <div class="tt-set-bonus">(2) Bonif.: Tus facultades Golpe sangriento y Golpe en el corazón tienen una probabilidad de otorgarte 180 p. de fuerza extra durante 15 seg.</div>
          <div class="tt-set-bonus">(4) Bonif.: Tu facultad Peste de sangre ahora tiene la probabilidad de infligir golpes críticos con su daño.</div>
        `;
      }
      if (d.itemset === 768) {  // Reemplaza CCC con el ID de tu conjunto "Profanación de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Profanación de Gladiador (0/5)</div>
          <div class="tt-set-piece">Pechera de placas de tinieblas de Gladiador furioso</div>
          <div class="tt-set-piece">Guanteletes de placas de tinieblas de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de placas de tinieblas de Gladiador furioso</div>
          <div class="tt-set-piece">Musleras de placas de tinieblas de Gladiador furioso</div>
          <div class="tt-set-piece">Sobrehombros de placas de tinieblas de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 50 p. el poder de ataque.</div>
          <div class="tt-set-bonus">(4) Bonif.: Cada vez que recibes un golpe con un efecto inmovilizador, generarás 15 p. de poder rúnico durante 5 seg.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta 150 p. el poder de ataque.</div>
        `;
      }
      if (d.itemset === 860) {  // Reemplaza DDD con el ID de tu conjunto "Persecución de Brisaveloz" en la base de datos
        html += `
          <div class="tt-set-title">Persecución de Brisaveloz (0/5)</div>
          <div class="tt-set-piece">Guerrera de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Manoplas de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Celada de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Musleras de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Bufas de conquista de Brisaveloz</div>
          <div class="tt-set-bonus">(2) Bonif.: El daño infligido por tu facultad Picadura de serpiente ahora puede infligir golpes críticos.</div>
          <div class="tt-set-bonus">(4) Bonif.: Cada vez que asestas un golpe a distancia, tienes una probabilidad de otorgar a tu mascota 600 p. de poder de ataque durante 15 seg.</div>
        `;
      }
      if (d.itemset === 859) {  // Reemplaza EEE con el ID de tu conjunto "Equipo de batalla de Brisaveloz" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Brisaveloz (0/5)</div>
          <div class="tt-set-piece">Celada de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Guerrera de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Musleras de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Bufas de conquista de Brisaveloz</div>
          <div class="tt-set-piece">Manoplas de conquista de Brisaveloz</div>
          <div class="tt-set-bonus">(2) Bonif.: El daño infligido por tu facultad Picadura de serpiente ahora puede infligir golpes críticos.</div>
          <div class="tt-set-bonus">(4) Bonif.: Cada vez que asestas un golpe a distancia, tienes una probabilidad de otorgar a tu mascota 600 p. de poder de ataque durante 15 seg.</div>
        `;
      }
      if (d.itemset === 772) {  // Reemplaza FFF con el ID de tu conjunto "Persecución de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Persecución de Gladiador (0/5)</div>
          <div class="tt-set-piece">Armadura de anillas de Gladiador furioso</div>
          <div class="tt-set-piece">Guanteletes de anillas de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de anillas de Gladiador furioso</div>
          <div class="tt-set-piece">Leotardos de anillas de Gladiador furioso</div>
          <div class="tt-set-piece">Bufas de anillas de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 50 p. el poder de ataque.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tus Trampas 2 segundos.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta 150 p. el poder de ataque.</div>
        `;
      }
      if (d.itemset === 866) {  // Reemplaza GGG con el ID de tu conjunto "Equipo de batalla de Thrall" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Thrall (0/5)</div>
          <div class="tt-set-piece">Coselete de conquista de Thrall</div>
          <div class="tt-set-piece">Mandiletes de conquista de Thrall</div>
          <div class="tt-set-piece">Visera de conquista de Thrall</div>
          <div class="tt-set-piece">Falda de guerra de conquista de Thrall</div>
          <div class="tt-set-piece">Guardahombros de conquista de Thrall</div>
          <div class="tt-set-bonus">(2) Bonif.: Añade un 3% extra de probabilidad de activar tu talento Choque estático.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 25% el daño infligido con tus facultades Choque de tierra, Choque de llamas y Choque de Escarcha.</div>
        `;
      }
      if (d.itemset === 863) {  // Reemplaza HHH con el ID de tu conjunto "Atavío de Thrall" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Thrall (0/5)</div>
          <div class="tt-set-piece">Camisote de conquista de Thrall</div>
          <div class="tt-set-piece">Guantes de conquista de Thrall</div>
          <div class="tt-set-piece">Yelmo de conquista de Thrall</div>
          <div class="tt-set-piece">Falda de conquista de Thrall</div>
          <div class="tt-set-piece">Hombreras de conquista de Thrall</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 9 s la duración de tu hechizo Choque de llamas.</div>
          <div class="tt-set-bonus">(4) Bonif.: Tu hechizo Ráfaga de lava provoca que tu objetivo se queme un 10 % extra del daño de tu hechizo durante 6 seg.</div>
        `;
      }
      if (d.itemset === 862) {  // Reemplaza III con el ID de tu conjunto "Atuendo de Thrall" en la base de datos
        html += `
          <div class="tt-set-title">Atuendo de Thrall (0/5)</div>
          <div class="tt-set-piece">Guerrera de conquista de Thrall</div>
          <div class="tt-set-piece">Manoplas de conquista de Thrall</div>
          <div class="tt-set-piece">Celada de conquista de Thrall</div>
          <div class="tt-set-piece">Musleras de conquista de Thrall</div>
          <div class="tt-set-piece">Bufas de conquista de Thrall</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la sanación realizada por tu hechizo Mareas Vivas un 20%.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 5% la probabilidad de golpe crítico con tu hechizo Sanación en cadena.</div>
        `;
      }
      if (d.itemset === 865) {  // Reemplaza JJJ con el ID de tu conjunto "Equipo de batalla de Nobundo" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Nobundo (0/5)</div>
          <div class="tt-set-piece">Coselete de conquista de Nobundo</div>
          <div class="tt-set-piece">Mandiletes de conquista de Nobundo</div>
          <div class="tt-set-piece">Visera de conquista de Nobundo</div>
          <div class="tt-set-piece">Falda de guerra de conquista de Nobundo</div>
          <div class="tt-set-piece">Guardahombros de conquista de Nobundo</div>
          <div class="tt-set-bonus">(2) Bonif.: Añade un 3% extra de probabilidad de activar tu talento Choque estático.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 25% el daño infligido con tus facultades Choque de tierra, Choque de llamas y Choque de Escarcha.</div>
        `;
      }
      if (d.itemset === 864) {  // Reemplaza KKK con el ID de tu conjunto "Atavío de Nobundo" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Nobundo (0/5)</div>
          <div class="tt-set-piece">Camisote de conquista de Nobundo</div>
          <div class="tt-set-piece">Guantes de conquista de Nobundo</div>
          <div class="tt-set-piece">Casco de conquista de Nobundo</div>
          <div class="tt-set-piece">Falda de conquista de Nobundo</div>
          <div class="tt-set-piece">Hombreras de conquista de Nobundo</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 9 s la duración de tu hechizo Choque de llamas.</div>
          <div class="tt-set-bonus">(4) Bonif.: Tu hechizo Ráfaga de lava provoca que tu objetivo se queme un 10% extra del daño de tu hechizo durante 6 seg.</div>
        `;
      }
      if (d.itemset === 861) {  // Reemplaza LLL con el ID de tu conjunto "Atuendo de Nobundo" en la base de datos
        html += `
          <div class="tt-set-title">Atuendo de Nobundo (0/5)</div>
          <div class="tt-set-piece">Celada de conquista de Nobundo</div>
          <div class="tt-set-piece">Guerrera de conquista de Nobundo</div>
          <div class="tt-set-piece">Musleras de conquista de Nobundo</div>
          <div class="tt-set-piece">Bufas de conquista de Nobundo</div>
          <div class="tt-set-piece">Manoplas de conquista de Nobundo</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la sanación realizada por tu hechizo Mareas Vivas un 20%.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 5% la probabilidad de golpe crítico con tu hechizo Sanación en cadena.</div>
        `;
      }
      if (d.itemset === 770) {  // Reemplaza MMM con el ID de tu conjunto "Sacudetierra de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Sacudetierra de Gladiador (0/5)</div>
          <div class="tt-set-piece">Armadura eslabonada de Gladiador furioso</div>
          <div class="tt-set-piece">Guanteletes eslabonados de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo eslabonado de Gladiador furioso</div>
          <div class="tt-set-piece">Leotardos eslabonados de Gladiador furioso</div>
          <div class="tt-set-piece">Bufas eslabonadas de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 50 p. el poder de ataque.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu Golpe de tormenta 2 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta 150 p. el poder de ataque.</div>
        `;
      }
      if (d.itemset === 769) {  // Reemplaza NNN con el ID de tu conjunto "Puño de trueno de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Puño de trueno de Gladiador (0/5)</div>
          <div class="tt-set-piece">Armadura de malla de Gladiador furioso</div>
          <div class="tt-set-piece">Guanteletes de malla de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de malla de Gladiador furioso</div>
          <div class="tt-set-piece">Leotardos de malla de Gladiador furioso</div>
          <div class="tt-set-piece">Bufas de malla de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Tótem derribador 1.5 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 771) {  // Reemplaza PPP con el ID de tu conjunto "Marea de guerra de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Marea de guerra de Gladiador (0/5)</div>
          <div class="tt-set-piece">Armadura de cota guarnecida de Gladiador furioso</div>
          <div class="tt-set-piece">Guanteletes de cota guarnecida de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de cota guarnecida de Gladiador furioso</div>
          <div class="tt-set-piece">Leotardos de cota guarnecida de Gladiador furioso</div>
          <div class="tt-set-piece">Bufas de cota guarnecida de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Tótem derribador 1.5 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 856) {  // Reemplaza QQQ con el ID de tu conjunto "Equipo de batalla de Tótem de Runa" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Tótem de Runa (0/5)</div>
          <div class="tt-set-piece">Protegecabezas de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Vestiduras de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Musleras de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Hombreras de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Lúas de conquista de Tótem de Runa</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Bramido 2 s, aumenta un 5 % el daño periódico infligido por tu facultad Lacerar y aumenta la duración de tu facultad Arañazo 3 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu Piel de corteza 12 s y aumenta la probabilidad de golpe crítico de Destripar y Mordedura feroz un 5 %.</div>
        `;
      }
      if (d.itemset === 854) {  // Reemplaza RRR con el ID de tu conjunto "Atavío de Tótem de Runa" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Tótem de Runa (0/5)</div>
          <div class="tt-set-piece">Guantes de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Cimera de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Calzas de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Vestimentas de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Manto de conquista de Tótem de Runa</div>
          <div class="tt-set-bonus">(2) Bonif.: Tu facultad Fuego lunar ahora tiene una probabilidad de infligir golpe crítico con su daño periódico.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 4% el daño infligido con tus hechizos Fuego estelar y Cólera.</div>
        `;
      }
      if (d.itemset === 852) {  // Reemplaza SSS con el ID de tu conjunto "Atuendo de Tótem de Runa" en la base de datos
        html += `
          <div class="tt-set-title">Atuendo de Tótem de Runa (0/5)</div>
          <div class="tt-set-piece">Manoplas de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Celada de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Leotardos de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Toga de conquista de Tótem de Runa</div>
          <div class="tt-set-piece">Bufas de conquista de Tótem de Runa</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta un 5% la probabilidad de golpe crítico de tu hechizo Nutrir.</div>
          <div class="tt-set-bonus">(4) Bonif.: Tu facultad Rejuvenecimiento ahora tiene una probabilidad de golpe crítico con sanaciones.</div>
        `;
      }
      if (d.itemset === 855) {  // Reemplaza TTT con el ID de tu conjunto "Equipo de batalla de Malfurion" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Malfurion (0/5)</div>
          <div class="tt-set-piece">Lúas de conquista de Malfurion</div>
          <div class="tt-set-piece">Protegecabezas de conquista de Malfurion</div>
          <div class="tt-set-piece">Musleras de conquista de Malfurion</div>
          <div class="tt-set-piece">Vestiduras de conquista de Malfurion</div>
          <div class="tt-set-piece">Hombreras de conquista de Malfurion</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Bramido 2 s, aumenta un 5 % el daño periódico infligido por tu facultad Lacerar y aumenta la duración de tu facultad Arañazo 3 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu Piel de corteza 12 s y aumenta la probabilidad de golpe crítico de Destripar y Mordedura feroz un 5 %.</div>
        `;
      }
      if (d.itemset === 853) {  // Reemplaza UUU con el ID de tu conjunto "Atavío de Malfurion" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Malfurion (0/5)</div>
          <div class="tt-set-piece">Cimera de conquista de Malfurion</div>
          <div class="tt-set-piece">Vestimentas de conquista de Malfurion</div>
          <div class="tt-set-piece">Calzas de conquista de Malfurion</div>
          <div class="tt-set-piece">Manto de conquista de Malfurion</div>
          <div class="tt-set-piece">Guantes de conquista de Malfurion</div>
          <div class="tt-set-bonus">(2) Bonif.: Tu facultad Fuego lunar ahora tiene una probabilidad de infligir golpe crítico con su daño periódico.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 4% el daño infligido con tus hechizos Fuego estelar y Cólera.</div>
        `;
      }
      if (d.itemset === 851) {  // Reemplaza VVV con el ID de tu conjunto "Atuendo de Malfurion" en la base de datos
        html += `
          <div class="tt-set-title">Atuendo de Malfurion (0/5)</div>
          <div class="tt-set-piece">Celada de conquista de Malfurion</div>
          <div class="tt-set-piece">Toga de conquista de Malfurion</div>
          <div class="tt-set-piece">Leotardos de conquista de Malfurion</div>
          <div class="tt-set-piece">Bufas de conquista de Malfurion</div>
          <div class="tt-set-piece">Manoplas de conquista de Malfurion</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta un 5% la probabilidad de golpe crítico de tu hechizo Nutrir.</div>
          <div class="tt-set-bonus">(4) Bonif.: Tu facultad Rejuvenecimiento ahora tiene una probabilidad de golpe crítico con sanaciones.</div>
        `;
      }
      if (d.itemset === 775) {  // Reemplaza WWW con el ID de tu conjunto "Santuario de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Santuario de Gladiador (0/5)</div>
          <div class="tt-set-piece">Togas de pellejo de dragón de Gladiador furioso</div>
          <div class="tt-set-piece">Musleras de pellejo de dragón de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de pellejo de dragón de Gladiador furioso</div>
          <div class="tt-set-piece">Bufas de pellejo de dragón de Gladiador furioso</div>
          <div class="tt-set-piece">Guantes de pellejo de dragón de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 50 p. el poder de ataque.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta tu velocidad de movimiento un 15% mientras estás en forma de oso, felina o de viaje. Solo funciona en exteriores.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta 150 p. el poder de ataque.</div>
        `;
      }
      if (d.itemset === 774) {  // Reemplaza XXX con el ID de tu conjunto "Envoltura salvaje de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Envoltura salvaje de Gladiador (0/5)</div>
          <div class="tt-set-piece">Bufas de pellejo de vermis de Gladiador furioso</div>
          <div class="tt-set-piece">Guantes de pellejo de vermis de Gladiador furioso</div>
          <div class="tt-set-piece">Musleras de pellejo de vermis de Gladiador furioso</div>
          <div class="tt-set-piece">Togas de pellejo de vermis de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de pellejo de vermis de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Tus hechizos Cólera tienen la posibilidad de reducir el tiempo de lanzamiento de tu próximo hechizo Fuego estelar en 1,5 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 773) {  // Reemplaza AAA2 con el ID de tu conjunto "Refugio de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Refugio de Gladiador (0/5)</div>
          <div class="tt-set-piece">Bufas de pellejo de kodo de Gladiador furioso</div>
          <div class="tt-set-piece">Guantes de pellejo de kodo de Gladiador furioso</div>
          <div class="tt-set-piece">Musleras de pellejo de kodo de Gladiador furioso</div>
          <div class="tt-set-piece">Togas de pellejo de kodo de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de pellejo de kodo de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Alivio presto 2 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 870) {  // Reemplaza YYY con el ID de tu conjunto "Placas de Grito Infernal" en la base de datos
        html += `
          <div class="tt-set-title">Placas de Grito Infernal (0/5)</div>
          <div class="tt-set-piece">Coraza de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Manoplas de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Gran yelmo de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Musleras de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Espaldares de conquista de Grito Infernal</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Provocar 2 s y aumenta un 5% el daño infligido por tu facultad Devastar.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Bloquear con escudo 10 s.</div>
        `;
      }
      if (d.itemset === 868) {  // Reemplaza ZZZ2 con el ID de tu conjunto "Equipo de batalla de Grito Infernal" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Grito Infernal (0/5)</div>
          <div class="tt-set-piece">Placa de batalla de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Guanteletes de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Casco de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Quijotes de conquista de Grito Infernal</div>
          <div class="tt-set-piece">Hombreras de placas de conquista de Grito Infernal</div>
          <div class="tt-set-bonus">(2) Bonif.: Actitud rabiosa otorga un 2% de probabilidad de golpe crítico extra. Actitud de batalla otorga un 6% de penetración de armadura extra.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 5% la probabilidad de golpe crítico de tus facultades Embate y Golpe heroico.</div>
        `;
      }
      if (d.itemset === 869) {  // Reemplaza DDD2 con el ID de tu conjunto "Placas de Wrynn" en la base de datos
        html += `
          <div class="tt-set-title">Placas de Wrynn (0/5)</div>
          <div class="tt-set-piece">Gran yelmo de conquista de Wrynn</div>
          <div class="tt-set-piece">Coraza de conquista de Wrynn</div>
          <div class="tt-set-piece">Musleras de conquista de Wrynn</div>
          <div class="tt-set-piece">Espaldares de conquista de Wrynn</div>
          <div class="tt-set-piece">Manoplas de conquista de Wrynn</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Provocar 2 s y aumenta un 5% el daño infligido por tu facultad Devastar.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Bloquear con escudo 10 s.</div>
        `;
      }
      if (d.itemset === 867) {  // Reemplaza EEE2 con el ID de tu conjunto "Equipo de batalla de Wrynn" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Wrynn (0/5)</div>
          <div class="tt-set-piece">Casco de conquista de Wrynn</div>
          <div class="tt-set-piece">Placa de batalla de conquista de Wrynn</div>
          <div class="tt-set-piece">Quijotes de conquista de Wrynn</div>
          <div class="tt-set-piece">Hombreras de placas de conquista de Wrynn</div>
          <div class="tt-set-piece">Guanteletes de conquista de Wrynn</div>
          <div class="tt-set-bonus">(2) Bonif.: Actitud rabiosa otorga un 2% de probabilidad de golpe crítico extra. Actitud de batalla otorga un 6% de penetración de armadura extra.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 5% la probabilidad de golpe crítico de tus facultades Embate y Golpe heroico.</div>
        `;
      }
      if (d.itemset === 765) {  // Reemplaza HHH2 con el ID de tu conjunto "Equipo de batalla de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Gladiador (0/5)</div>
          <div class="tt-set-piece">Pechera de placas de Gladiador furioso</div>
          <div class="tt-set-piece">Guanteletes de placas de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de placas de Gladiador furioso</div>
          <div class="tt-set-piece">Musleras de placas de Gladiador furioso</div>
          <div class="tt-set-piece">Sobrehombros de placas de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 50 p. el poder de ataque.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Interceptar 5 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta 150 p. el poder de ataque.</div>
        `;
      }
      if (d.itemset === 844) {  // Reemplaza XXX2 con el ID de tu conjunto "Atavío de Caminante del Sol" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Caminante del Sol (0/5)</div>
          <div class="tt-set-piece">Guanteletes de conquista de Caminante del Sol</div>
          <div class="tt-set-piece">Caperuza de conquista de Caminante del Sol</div>
          <div class="tt-set-piece">Leotardos de conquista de Caminante del Sol</div>
          <div class="tt-set-piece">Toga de conquista de Caminante del Sol</div>
          <div class="tt-set-piece">Hombreras de conquista de Caminante del Sol</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la armadura que obtienes de Armadura de hielo un 20%, la regeneración de maná que obtienes de Armadura de mago un 10% y añade un 15% extra de tu espíritu en índice de golpe crítico cuando Armadura de arrabio está activo.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 5% la probabilidad de golpe crítico de tus hechizos Bola de Fuego, Descarga de Escarcha, Descarga de Pirofrío, Misiles Arcanos y Explosión Arcana.</div>
        `;
      }
      if (d.itemset === 843) {  // Reemplaza YYY3 con el ID de tu conjunto "Atavío de Khadgar" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Khadgar (0/5)</div>
          <div class="tt-set-piece">Caperuza de conquista de Khadgar</div>
          <div class="tt-set-piece">Toga de conquista de Khadgar</div>
          <div class="tt-set-piece">Leotardos de conquista de Khadgar</div>
          <div class="tt-set-piece">Hombreras de conquista de Khadgar</div>
          <div class="tt-set-piece">Guanteletes de conquista de Khadgar</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la armadura que obtienes de Armadura de hielo un 20%, la regeneración de maná que obtienes de Armadura de mago un 10% y añade un 15% extra de tu espíritu en índice de golpe crítico cuando Armadura de arrabio está activo.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 5% la probabilidad de golpe crítico de tus hechizos Bola de Fuego, Descarga de Escarcha, Descarga de Pirofrío, Misiles Arcanos y Explosión Arcana.</div>
        `;
      }
      if (d.itemset === 779) {  // Reemplaza BBB3 con el ID de tu conjunto "Atavío de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Gladiador (0/5)</div>
          <div class="tt-set-piece">Capucha de seda de Gladiador furioso</div>
          <div class="tt-set-piece">Vestiduras de seda de Gladiador furioso</div>
          <div class="tt-set-piece">Calzas de seda de Gladiador furioso</div>
          <div class="tt-set-piece">Amito de seda de Gladiador furioso</div>
          <div class="tt-set-piece">Manoplas de seda de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de lanzamiento de tu hechizo Polimorfia 0.15 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 878) {  // Reemplaza CCC4 con el ID de tu conjunto "Equipo de batalla de Liadrin" en la base de datos
      html += `
        <div class="tt-set-title">Equipo de batalla de Liadrin (0/5)</div>
        <div class="tt-set-piece">Hombreras de placas de conquista de Liadrin</div>
        <div class="tt-set-piece">Quijotes de conquista de Liadrin</div>
        <div class="tt-set-piece">Yelmo de conquista de Liadrin</div>
        <div class="tt-set-piece">Guanteletes de conquista de Liadrin</div>
        <div class="tt-set-piece">Placa de batalla de conquista de Liadrin</div>
        <div class="tt-set-bonus">(2) Bonif.: Tu talento Venganza recta ahora tiene una probabilidad de golpe crítico cuando inflige daño.</div>
        <div class="tt-set-bonus">(4) Bonif.: Aumenta la probabilidad de golpe crítico de tus Sentencias un 5%.</div>
      `;
    }
    if (d.itemset === 880) {  // Reemplaza DDD4 con el ID de tu conjunto "Placas de Liadrin" en la base de datos
        html += `
          <div class="tt-set-title">Placas de Liadrin (0/5)</div>
          <div class="tt-set-piece">Coraza de conquista de Liadrin</div>
          <div class="tt-set-piece">Manoplas de conquista de Liadrin</div>
          <div class="tt-set-piece">Visera de conquista de Liadrin</div>
          <div class="tt-set-piece">Musleras de conquista de Liadrin</div>
          <div class="tt-set-piece">Guardahombros de conquista de Liadrin</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Mano de expiación 2 s y aumenta un 5% el daño infligido por tu facultad Martillo del honrado.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Protección divina y reduce la duración de Abstinencia 30 s.</div>
        `;
      }
      if (d.itemset === 876) {  // Reemplaza EEE4 con el ID de tu conjunto "Atuendo de Liadrin" en la base de datos
        html += `
          <div class="tt-set-title">Atuendo de Liadrin (0/5)</div>
          <div class="tt-set-piece">Bufas de conquista de Liadrin</div>
          <div class="tt-set-piece">Grebas de conquista de Liadrin</div>
          <div class="tt-set-piece">Celada de conquista de Liadrin</div>
          <div class="tt-set-piece">Guantes de conquista de Liadrin</div>
          <div class="tt-set-piece">Guerrera de conquista de Liadrin</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 10 s la duración de tus Sentencias.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 100% el efecto de sanación en el tiempo de Destello de luz en conjunción con Escudo sacro.</div>
        `;
      }
      if (d.itemset === 877) {  // Reemplaza FFF5 con el ID de tu conjunto "Equipo de batalla de Turalyon" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Turalyon (0/5)</div>
          <div class="tt-set-piece">Placa de batalla de conquista de Turalyon</div>
          <div class="tt-set-piece">Guanteletes de conquista de Turalyon</div>
          <div class="tt-set-piece">Yelmo de conquista de Turalyon</div>
          <div class="tt-set-piece">Quijotes de conquista de Turalyon</div>
          <div class="tt-set-piece">Hombreras de placas de conquista de Turalyon</div>
          <div class="tt-set-bonus">(2) Bonif.: Tu talento Venganza recta ahora tiene una probabilidad de golpe crítico cuando inflige daño.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta la probabilidad de golpe crítico de tus Sentencias un 5%.</div>
        `;
      }
      if (d.itemset === 879) {  // Reemplaza GGG5 con el ID de tu conjunto "Placas de Turalyon" en la base de datos
        html += `
          <div class="tt-set-title">Placas de Turalyon (0/5)</div>
          <div class="tt-set-piece">Coraza de conquista de Turalyon</div>
          <div class="tt-set-piece">Manoplas de conquista de Turalyon</div>
          <div class="tt-set-piece">Visera de conquista de Turalyon</div>
          <div class="tt-set-piece">Musleras de conquista de Turalyon</div>
          <div class="tt-set-piece">Guardahombros de conquista de Turalyon</div>
          <div class="tt-set-bonus">(2) Bonif.: Reduce el tiempo de reutilización de tu facultad Mano de expiación 2 s y aumenta un 5% el daño infligido por tu facultad Martillo del honrado.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tu facultad Protección divina y reduce la duración de Abstinencia 30 s.</div>
        `;
      }
      if (d.itemset === 875) {  // Reemplaza HHH5 con el ID de tu conjunto "Atuendo de Turalyon" en la base de datos
        html += `
          <div class="tt-set-title">Atuendo de Turalyon (0/5)</div>
          <div class="tt-set-piece">Celada de conquista de Turalyon</div>
          <div class="tt-set-piece">Guerrera de conquista de Turalyon</div>
          <div class="tt-set-piece">Grebas de conquista de Turalyon</div>
          <div class="tt-set-piece">Bufas de conquista de Turalyon</div>
          <div class="tt-set-piece">Guantes de conquista de Turalyon</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 10 s la duración de tus Sentencias.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 100% el efecto de sanación en el tiempo de Destello de luz en conjunción con Escudo sacro.</div>
        `;
      }
      if (d.itemset === 766) {  // Reemplaza III2 con el ID de tu conjunto "Vindicación de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Vindicación de Gladiador (0/5)</div>
          <div class="tt-set-piece">Pechera escamada de Gladiador furioso</div>
          <div class="tt-set-piece">Guanteletes escamados de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo escamado de Gladiador furioso</div>
          <div class="tt-set-piece">Musleras escamadas de Gladiador furioso</div>
          <div class="tt-set-piece">Sobrehombros escamados de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 50 p. el poder de ataque.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce el tiempo de reutilización de tus Sentencias 1 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta 150 p. el poder de ataque.</div>
        `;
      }
      if (d.itemset === 767) {  // Reemplaza LLL2 con el ID de tu conjunto "Redención de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Redención de Gladiador (0/5)</div>
          <div class="tt-set-piece">Coselete ornamentado de Gladiador furioso</div>
          <div class="tt-set-piece">Guantes ornamentados de Gladiador furioso</div>
          <div class="tt-set-piece">Cimera ornamentada de Gladiador furioso</div>
          <div class="tt-set-piece">Quijotes ornamentados de Gladiador furioso</div>
          <div class="tt-set-piece">Bufas ornamentadas de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta la sanación de tu hechizo Choque Sagrado un 10%.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 858) {  // Reemplaza OOO3 con el ID de tu conjunto "Equipo de batalla de Garona" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de Garona (0/5)</div>
          <div class="tt-set-piece">Coraza de conquista de Garona</div>
          <div class="tt-set-piece">Guanteletes de conquista de Garona</div>
          <div class="tt-set-piece">Casco de conquista de Garona</div>
          <div class="tt-set-piece">Quijotes de conquista de Garona</div>
          <div class="tt-set-piece">Espaldares de conquista de Garona</div>
          <div class="tt-set-bonus">(2) Bonif.: Tu facultad Ruptura tiene una probabilidad, cada vez que inflige daño, de reducir el coste de tu siguiente facultad en 40 p. de energía.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta la probabilidad de golpe crítico de tus facultades Hemorragia, Golpe siniestro, Puñalada y Mutilar en un 5%.</div>
        `;
      }
      if (d.itemset === 857) {  // Reemplaza RRR3 con el ID de tu conjunto "Equipo de batalla de VanCleef" en la base de datos
        html += `
          <div class="tt-set-title">Equipo de batalla de VanCleef (0/5)</div>
          <div class="tt-set-piece">Casco de conquista de VanCleef</div>
          <div class="tt-set-piece">Coraza de conquista de VanCleef</div>
          <div class="tt-set-piece">Quijotes de conquista de VanCleef</div>
          <div class="tt-set-piece">Espaldares de conquista de VanCleef</div>
          <div class="tt-set-piece">Guanteletes de conquista de VanCleef</div>
          <div class="tt-set-bonus">(2) Bonif.: Tu facultad Ruptura tiene una probabilidad, cada vez que inflige daño, de reducir el coste de tu siguiente facultad en 40 p. de energía.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta la probabilidad de golpe crítico de tus facultades Hemorragia, Golpe siniestro, Puñalada y Mutilar un 5%.</div>
        `;
      }
      if (d.itemset === 776) {  // Reemplaza SSS4 con el ID de tu conjunto "Vestimentas de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Vestimentas de Gladiador (0/5)</div>
          <div class="tt-set-piece">Guerrera de cuero de Gladiador furioso</div>
          <div class="tt-set-piece">Musleras de cuero de Gladiador furioso</div>
          <div class="tt-set-piece">Yelmo de cuero de Gladiador furioso</div>
          <div class="tt-set-piece">Bufas de cuero de Gladiador furioso</div>
          <div class="tt-set-piece">Guantes de cuero de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta 50 p. el poder de ataque.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta tu energía máxima 10 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta 150 p. el poder de ataque.</div>
        `;
      }
      if (d.itemset === 850) {  // Reemplaza AAA4 con el ID de tu conjunto "Atavío de Zabra" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Zabra (0/5)</div>
          <div class="tt-set-piece">Manijas de conquista de Zabra</div>
          <div class="tt-set-piece">Aro de conquista de Zabra</div>
          <div class="tt-set-piece">Pantalones de conquista de Zabra</div>
          <div class="tt-set-piece">Vestiduras de conquista de Zabra</div>
          <div class="tt-set-piece">Manto de conquista de Zabra</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la duración de tu hechizo Toque vampírico 6 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta la probabilidad de golpe crítico de tu hechizo Tortura mental un 5%.</div>
        `;
      }
      if (d.itemset === 848) {  // Reemplaza BBB4 con el ID de tu conjunto "Vestiduras de Zabra" en la base de datos
        html += `
          <div class="tt-set-title">Vestiduras de Zabra (0/5)</div>
          <div class="tt-set-piece">Guantes de conquista de Zabra</div>
          <div class="tt-set-piece">Capucha de conquista de Zabra</div>
          <div class="tt-set-piece">Leotardos de conquista de Zabra</div>
          <div class="tt-set-piece">Toga de conquista de Zabra</div>
          <div class="tt-set-piece">Hombreras de conquista de Zabra</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la sanación realizada por tu hechizo Rezo de alivio un 20%.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 10% el escudo de tu Égida divina y la sanación instantánea de tu Renovar potenciado.</div>
        `;
      }
      if (d.itemset === 849) {  // Reemplaza CCC6 con el ID de tu conjunto "Atavío de Velen" en la base de datos
        html += `
          <div class="tt-set-title">Atavío de Velen (0/5)</div>
          <div class="tt-set-piece">Manijas de conquista de Velen</div>
          <div class="tt-set-piece">Aro de conquista de Velen</div>
          <div class="tt-set-piece">Pantalones de conquista de Velen</div>
          <div class="tt-set-piece">Vestiduras de conquista de Velen</div>
          <div class="tt-set-piece">Manto de conquista de Velen</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la duración de tu hechizo Toque vampírico 6 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta la probabilidad de golpe crítico de tu hechizo Tortura mental un 5%.</div>
        `;
      }
      if (d.itemset === 847) {  // Reemplaza DDD6 con el ID de tu conjunto "Vestiduras de Velen" en la base de datos
        html += `
          <div class="tt-set-title">Vestiduras de Velen (0/5)</div>
          <div class="tt-set-piece">Capucha de conquista de Velen</div>
          <div class="tt-set-piece">Toga de conquista de Velen</div>
          <div class="tt-set-piece">Leotardos de conquista de Velen</div>
          <div class="tt-set-piece">Hombreras de conquista de Velen</div>
          <div class="tt-set-piece">Guantes de conquista de Velen</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta la sanación realizada por tu hechizo Rezo de alivio un 20%.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta un 10% el escudo de tu Égida divina y la sanación instantánea de tu Renovar potenciado.</div>
        `;
      }
      if (d.itemset === 778) {  // Reemplaza FFF6 con el ID de tu conjunto "Vestiduras de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Vestiduras de Gladiador (0/5)</div>
          <div class="tt-set-piece">Caperuza de satén de Gladiador furioso</div>
          <div class="tt-set-piece">Toga de satén de Gladiador furioso</div>
          <div class="tt-set-piece">Leotardos de satén de Gladiador furioso</div>
          <div class="tt-set-piece">Manto de satén de Gladiador furioso</div>
          <div class="tt-set-piece">Guantes de satén de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce la duración del efecto de Alma debilitada causado por tu Palabra de poder superior: escudo 2 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      if (d.itemset === 777) {  // Reemplaza KKK6 con el ID de tu conjunto "Investidura de Gladiador" en la base de datos
        html += `
          <div class="tt-set-title">Investidura de Gladiador (0/5)</div>
          <div class="tt-set-piece">Caperuza de tela lunar de Gladiador furioso</div>
          <div class="tt-set-piece">Toga de tela lunar de Gladiador furioso</div>
          <div class="tt-set-piece">Leotardos de tela lunar de Gladiador furioso</div>
          <div class="tt-set-piece">Manto de tela lunar de Gladiador furioso</div>
          <div class="tt-set-piece">Guantes de tela lunar de Gladiador furioso</div>
          <div class="tt-set-bonus">(2) Bonif.: +100 (1.06% @ L80) p. de índice de temple.</div>
          <div class="tt-set-bonus">(2) Bonif.: Aumenta el poder con hechizos 29 p.</div>
          <div class="tt-set-bonus">(4) Bonif.: Reduce la duración del efecto de Alma debilitada causado por tu Palabra de poder superior: escudo 2 s.</div>
          <div class="tt-set-bonus">(4) Bonif.: Aumenta el poder con hechizos 88 p.</div>
        `;
      }
      html += `</div>`;  // cierra .ttitem
      instance.setContent(html);
    }
  });
});