// ============================================================
// 🔗 PUENTE PLANILLA → SUPABASE  (STA-tabacal)
// Pegá TODO este bloque al final de tu Apps Script (Code.gs).
// Manda los partidos (y la tabla de grupos) de la planilla
// a la base de datos Supabase de la app.
// ============================================================

var SUPABASE = {
  URL: "https://ldfsmdmppywlbmiofksi.supabase.co",
  // ⚠️ PEGÁ ACÁ la service_role key del proyecto STA-tabacal
  //    (Supabase → Settings → API → service_role, la larga "eyJ...").
  //    NO uses la "anon"/publishable, no tiene permiso para escribir.
  SERVICE_KEY: "PEGA_TU_SERVICE_ROLE_KEY_ACA"
};

// ── Normaliza el estado del sheet al que espera la base ──
function _normalizarEstado(valor) {
  var v = (valor == null ? "" : String(valor)).trim();
  if (v === "") return { estado: "programado", estado_raw: null };
  if (v.indexOf("en_vivo") === 0)  return { estado: "en_vivo",   estado_raw: v };
  if (v.indexOf("entretiempo") === 0) return { estado: "en_vivo", estado_raw: v };
  return { estado: v, estado_raw: null }; // finalizado, programado, pospuesto, cancelado
}

function _num(v) { return (v === "" || v === null || v === undefined) ? null : Number(v); }

// ============================================================
// 1) SINCRONIZAR PARTIDOS  (resultados, estado, penales, fechas)
// ============================================================
function syncPartidosSupabase() {
  if (SUPABASE.SERVICE_KEY === "PEGA_TU_SERVICE_ROLE_KEY_ACA") {
    Logger.log("❌ Falta pegar la SERVICE_KEY en la config SUPABASE.");
    return 0;
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA_PARTIDOS);
  var data = sheet.getDataRange().getValues();
  // Columnas: 0 id, 1 fase, 2 grupo, 3 jornada, 4 fecha_hora, 5 sede,
  //           6 local, 7 visitante, 8 goles_local, 9 goles_visit,
  //           10 estado, 11 event_id, 12 penales_local, 13 penales_visit
  var filas = [];
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0];
    if (!id) continue;
    if (data[i][1] === "test") continue; // ignorar fase de prueba
    var est = _normalizarEstado(data[i][10]);
    var fecha = data[i][4];
    filas.push({
      id: String(id),
      fase: data[i][1] || "grupos",
      grupo: data[i][2] || null,
      jornada: _num(data[i][3]),
      fecha_hora: (fecha instanceof Date)
        ? Utilities.formatDate(fecha, CONFIG.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX")
        : (fecha || null),
      sede: data[i][5] || null,
      local: data[i][6] || null,
      visitante: data[i][7] || null,
      goles_local: _num(data[i][8]),
      goles_visitante: _num(data[i][9]),
      estado: est.estado,
      estado_raw: est.estado_raw,
      event_id: data[i][11] ? String(data[i][11]) : null,
      penales_local: _num(data[i][12]),
      penales_visit: _num(data[i][13])
    });
  }
  var n = _upsertSupabase("partidos", filas);
  Logger.log("✅ Partidos sincronizados a Supabase: " + n);
  return n;
}

// ============================================================
// 2) SINCRONIZAR TABLA DE GRUPOS  (posiciones / stats → selecciones)
// ============================================================
function syncGruposSupabase() {
  if (SUPABASE.SERVICE_KEY === "PEGA_TU_SERVICE_ROLE_KEY_ACA") {
    Logger.log("❌ Falta pegar la SERVICE_KEY en la config SUPABASE.");
    return 0;
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA_GRUPOS);
  if (!sheet) { Logger.log("⚠️ No existe la hoja " + CONFIG.HOJA_GRUPOS); return 0; }
  var data = sheet.getDataRange().getValues();
  // Columnas Grupos: 0 grupo, 1 codigo, 2 nombre, 3 bandera_url,
  //   4 j, 5 g, 6 e, 7 p, 8 gf, 9 gc, 10 dif, 11 pts, 12 pos
  var filas = [];
  for (var i = 1; i < data.length; i++) {
    var codigo = data[i][1];
    if (!codigo) continue;
    filas.push({
      codigo: String(codigo),
      nombre: data[i][2] || String(codigo),
      bandera_url: data[i][3] || null,
      grupo: data[i][0] || null,
      j: _num(data[i][4]),  g: _num(data[i][5]),  e: _num(data[i][6]),
      p: _num(data[i][7]),  gf: _num(data[i][8]), gc: _num(data[i][9]),
      dif: _num(data[i][10]), pts: _num(data[i][11]), pos: _num(data[i][12])
    });
  }
  var n = _upsertSupabase("selecciones", filas);
  Logger.log("✅ Selecciones sincronizadas a Supabase: " + n);
  return n;
}

// ============================================================
// 3) SINCRONIZAR TODO (lo que llamás desde el menú o el trigger)
// ============================================================
function syncSupabaseTodo() {
  var p = syncPartidosSupabase();
  var s = syncGruposSupabase();
  return { partidos: p, selecciones: s };
}

// ── Helper: upsert por lotes a Supabase (REST) ──
function _upsertSupabase(tabla, filas) {
  if (!filas.length) return 0;
  var url = SUPABASE.URL + "/rest/v1/" + tabla + "?on_conflict=" +
            (tabla === "partidos" ? "id" : "codigo");
  var total = 0;
  var LOTE = 100;
  for (var k = 0; k < filas.length; k += LOTE) {
    var chunk = filas.slice(k, k + LOTE);
    var resp = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: {
        "apikey": SUPABASE.SERVICE_KEY,
        "Authorization": "Bearer " + SUPABASE.SERVICE_KEY,
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      payload: JSON.stringify(chunk),
      muteHttpExceptions: true
    });
    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) {
      total += chunk.length;
    } else {
      Logger.log("❌ Error " + code + " en " + tabla + ": " + resp.getContentText());
    }
  }
  return total;
}

// ============================================================
// 4) (OPCIONAL) Trigger automático cada 5 minutos
//    Ejecutá UNA vez "instalarSyncSupabase" para activarlo.
// ============================================================
function instalarSyncSupabase() {
  // limpiar triggers viejos de esta función
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "syncSupabaseTodo") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("syncSupabaseTodo").timeBased().everyMinutes(5).create();
  Logger.log("✅ Trigger creado: syncSupabaseTodo cada 5 minutos");
}
