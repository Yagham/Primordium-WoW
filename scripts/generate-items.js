// scripts/generate-items.js
const fs   = require('fs');
const mysql= require('mysql2/promise');

// — Mapeo de bitmask AllowableClass → nombre de clase
const CLASS_MAP = {
  1:   'Guerrero',
  2:   'Paladín',
  4:   'Cazador',
  8:   'Pícaro',
  16:  'Sacerdote',
  32:  'Caballero de la Muerte',
  64:  'Chamán',
  128: 'Mago',
  256: 'Brujo',
  1024: 'Druida'
};

// — Convierte rawMask a arreglo de nombres de clase; 
//    si rawMask es –1 o 32767 (todas), devuelve []
function decodeAllowedClasses(rawMask) {
  if (rawMask === -1 || rawMask === 32767) {
    return [];
  }
  const mask = rawMask >>> 0; // a entero sin signo
  const clases = [];
  for (const bitStr in CLASS_MAP) {
    const bit = Number(bitStr);
    if (mask & bit) {
      clases.push(CLASS_MAP[bit]);
    }
  }
  return clases;
}

// 1) Leemos los IDs de products.json
const prods = require('../products.json');
const ids   = prods.map(p => p.wowheadId);

async function main() {
  // 2) Conéctate a tu base de datos
  const conn = await mysql.createConnection({
    host:     '127.0.0.1',
    user:     'root',
    password: 'Dani3269',
    database: 'world'
  });

  // 3) Ejecutamos la consulta solo para esos IDs
  const [rows] = await conn.execute(`
    SELECT
      entry          AS id,
      name,
      bonding,
      maxcount,
      InventoryType  AS invType,
      class,
      subclass,
      Quality        AS quality,
      ItemLevel      AS itemLevel,
      RequiredLevel  AS requiredLevel,
      description,
      dmg_min1       AS dmgMin,
      dmg_max1       AS dmgMax,
      delay,
      armor,
      itemset,
      Material,
      stat_type1, stat_value1,
      stat_type2, stat_value2,
      stat_type3, stat_value3,
      stat_type4, stat_value4,
      stat_type5, stat_value5,
      stat_type6, stat_value6,
      socketColor_1, socketContent_1,
      socketColor_2, socketContent_2,
      socketColor_3, socketContent_3,
      socketBonus,
      AllowableClass
    FROM item_template
    WHERE entry IN (${ids.join(',')})
  `);

  //  — Decodificamos AllowableClass en allowedClasses (solo si hay clases específicas)
  const processed = rows.map(item => {
    const clases = decodeAllowedClasses(item.AllowableClass);
    if (clases.length) {
      item.allowedClasses = clases;
    }
    // (Opcional: puedes eliminar el campo raw AllowableClass si no lo necesitas en el JSON final)
    // delete item.AllowableClass;
    return item;
  });
  // 4) Volcamos a JSON en api/items.json
  fs.writeFileSync(
    'api/items.json',
    JSON.stringify(processed, null, 2),
    'utf-8'
  );

  console.log(`✅ api/items.json generado con ${rows.length} items`);
  await conn.end();
}

main().catch(err => {
  console.error('❌ Error generando items.json:', err.message);
  process.exit(1);
});