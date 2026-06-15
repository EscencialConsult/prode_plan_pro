-- ════════════════════════════════════════════════════════════════
-- SIMULACIÓN — Bloqueo por partido (REVERSIBLE, sin pérdida de datos)
-- ════════════════════════════════════════════════════════════════
-- Requisito: haber corrido antes sql/cierre_por_partido.sql
--            (acá se usa la función partido_abierto()).
--
-- Cómo usarlo:
--   1) Corré el PASO 1 para ver los partidos y su estado "abierto".
--   2) Corré el PASO 2 (simula que CZE vs RSA ya arrancó).
--   3) Corré el PASO 3 para confirmar que quedó cerrado (abierto = false).
--   4) Andá a la web, refrescá con Ctrl+Shift+R y probá:
--        - CZE vs RSA debe aparecer BLOQUEADO ("Cerrado — el partido ya comenzó")
--        - Los demás partidos del grupo siguen editables y se pueden guardar.
--   5) Cuando termines, corré el PASO 4 para DEJAR TODO COMO ESTABA.
-- ════════════════════════════════════════════════════════════════


-- ── PASO 1 — Ver partidos del grupo 18/06 y si están abiertos ──────────────
SELECT p.id, p.local, p.visitante, p.fecha_hora, p.estado,
       partido_abierto(p.id) AS abierto
FROM partidos p
WHERE (p.local, p.visitante) IN (('CZE','RSA'), ('MEX','KOR'), ('SUI','BIH'))
ORDER BY p.fecha_hora;


-- ── PASO 2 — SIMULAR que CZE vs RSA ya inició (se mueve 100 días al pasado) ─
UPDATE partidos
SET fecha_hora = fecha_hora - interval '100 days'
WHERE local = 'CZE' AND visitante = 'RSA';


-- ── PASO 3 — Verificar: "abierto" debe ser FALSE ──────────────────────────
SELECT id, local, visitante, fecha_hora, estado, partido_abierto(id) AS abierto
FROM partidos
WHERE local = 'CZE' AND visitante = 'RSA';


-- ══════════════════════════════════════════════════════════════════════════
-- (Probá en la web acá. Cuando termines, corré SOLO el PASO 4.)
-- ══════════════════════════════════════════════════════════════════════════


-- ── PASO 4 — REVERTIR: devuelve el partido a su fecha original exacta ──────
UPDATE partidos
SET fecha_hora = fecha_hora + interval '100 days'
WHERE local = 'CZE' AND visitante = 'RSA';
