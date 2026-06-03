-- ════════════════════════════════════════════════════════════
-- SEED: Selecciones + Partidos (fase de grupos Mundial 2026)
-- Generado desde la planilla Mundial2026. Idempotente (ON CONFLICT).
-- Ejecutar en: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- ─── 1) SELECCIONES (48 equipos) ───
INSERT INTO public.selecciones (codigo, nombre, bandera_url, grupo, j, g, e, p, gf, gc, dif, pts, pos) VALUES
  ('MEX', 'México', 'https://flagcdn.com/w80/mx.png', 'A', 0,0,0,0,0,0,0,0, NULL),
  ('RSA', 'Sudáfrica', 'https://flagcdn.com/w80/za.png', 'A', 0,0,0,0,0,0,0,0, NULL),
  ('KOR', 'Corea del Sur', 'https://flagcdn.com/w80/kr.png', 'A', 0,0,0,0,0,0,0,0, NULL),
  ('CZE', 'Rep. Checa', 'https://flagcdn.com/w80/cz.png', 'A', 0,0,0,0,0,0,0,0, NULL),
  ('CAN', 'Canadá', 'https://flagcdn.com/w80/ca.png', 'B', 0,0,0,0,0,0,0,0, NULL),
  ('BIH', 'Bosnia y H.', 'https://flagcdn.com/w80/ba.png', 'B', 0,0,0,0,0,0,0,0, NULL),
  ('QAT', 'Qatar', 'https://flagcdn.com/w80/qa.png', 'B', 0,0,0,0,0,0,0,0, NULL),
  ('SUI', 'Suiza', 'https://flagcdn.com/w80/ch.png', 'B', 0,0,0,0,0,0,0,0, NULL),
  ('BRA', 'Brasil', 'https://flagcdn.com/w80/br.png', 'C', 0,0,0,0,0,0,0,0, NULL),
  ('MAR', 'Marruecos', 'https://flagcdn.com/w80/ma.png', 'C', 0,0,0,0,0,0,0,0, NULL),
  ('SCO', 'Escocia', 'https://flagcdn.com/w80/gb-sct.png', 'C', 0,0,0,0,0,0,0,0, NULL),
  ('HAI', 'Haití', 'https://flagcdn.com/w80/ht.png', 'C', 0,0,0,0,0,0,0,0, NULL),
  ('USA', 'Estados Unidos', 'https://flagcdn.com/w80/us.png', 'D', 0,0,0,0,0,0,0,0, NULL),
  ('PAR', 'Paraguay', 'https://flagcdn.com/w80/py.png', 'D', 0,0,0,0,0,0,0,0, NULL),
  ('AUS', 'Australia', 'https://flagcdn.com/w80/au.png', 'D', 0,0,0,0,0,0,0,0, NULL),
  ('TUR', 'Turquía', 'https://flagcdn.com/w80/tr.png', 'D', 0,0,0,0,0,0,0,0, NULL),
  ('GER', 'Alemania', 'https://flagcdn.com/w80/de.png', 'E', 0,0,0,0,0,0,0,0, NULL),
  ('CUW', 'Curazao', 'https://flagcdn.com/w80/cw.png', 'E', 0,0,0,0,0,0,0,0, NULL),
  ('CIV', 'Costa de Marfil', 'https://flagcdn.com/w80/ci.png', 'E', 0,0,0,0,0,0,0,0, NULL),
  ('ECU', 'Ecuador', 'https://flagcdn.com/w80/ec.png', 'E', 0,0,0,0,0,0,0,0, NULL),
  ('NED', 'Países Bajos', 'https://flagcdn.com/w80/nl.png', 'F', 0,0,0,0,0,0,0,0, NULL),
  ('JPN', 'Japón', 'https://flagcdn.com/w80/jp.png', 'F', 0,0,0,0,0,0,0,0, NULL),
  ('SWE', 'Suecia', 'https://flagcdn.com/w80/se.png', 'F', 0,0,0,0,0,0,0,0, NULL),
  ('TUN', 'Túnez', 'https://flagcdn.com/w80/tn.png', 'F', 0,0,0,0,0,0,0,0, NULL),
  ('BEL', 'Bélgica', 'https://flagcdn.com/w80/be.png', 'G', 0,0,0,0,0,0,0,0, NULL),
  ('EGY', 'Egipto', 'https://flagcdn.com/w80/eg.png', 'G', 0,0,0,0,0,0,0,0, NULL),
  ('IRN', 'Irán', 'https://flagcdn.com/w80/ir.png', 'G', 0,0,0,0,0,0,0,0, NULL),
  ('NZL', 'Nueva Zelanda', 'https://flagcdn.com/w80/nz.png', 'G', 0,0,0,0,0,0,0,0, NULL),
  ('ESP', 'España', 'https://flagcdn.com/w80/es.png', 'H', 0,0,0,0,0,0,0,0, NULL),
  ('CPV', 'Cabo Verde', 'https://flagcdn.com/w80/cv.png', 'H', 0,0,0,0,0,0,0,0, NULL),
  ('KSA', 'Arabia Saudita', 'https://flagcdn.com/w80/sa.png', 'H', 0,0,0,0,0,0,0,0, NULL),
  ('URU', 'Uruguay', 'https://flagcdn.com/w80/uy.png', 'H', 0,0,0,0,0,0,0,0, NULL),
  ('FRA', 'Francia', 'https://flagcdn.com/w80/fr.png', 'I', 0,0,0,0,0,0,0,0, NULL),
  ('IRQ', 'Irak', 'https://flagcdn.com/w80/iq.png', 'I', 0,0,0,0,0,0,0,0, NULL),
  ('SEN', 'Senegal', 'https://flagcdn.com/w80/sn.png', 'I', 0,0,0,0,0,0,0,0, NULL),
  ('NOR', 'Noruega', 'https://flagcdn.com/w80/no.png', 'I', 0,0,0,0,0,0,0,0, NULL),
  ('ARG', 'Argentina', 'https://flagcdn.com/w80/ar.png', 'J', 0,0,0,0,0,0,0,0, NULL),
  ('ALG', 'Argelia', 'https://flagcdn.com/w80/dz.png', 'J', 0,0,0,0,0,0,0,0, NULL),
  ('AUT', 'Austria', 'https://flagcdn.com/w80/at.png', 'J', 0,0,0,0,0,0,0,0, NULL),
  ('JOR', 'Jordania', 'https://flagcdn.com/w80/jo.png', 'J', 0,0,0,0,0,0,0,0, NULL),
  ('POR', 'Portugal', 'https://flagcdn.com/w80/pt.png', 'K', 0,0,0,0,0,0,0,0, NULL),
  ('COD', 'RD del Congo', 'https://flagcdn.com/w80/cd.png', 'K', 0,0,0,0,0,0,0,0, NULL),
  ('UZB', 'Uzbekistán', 'https://flagcdn.com/w80/uz.png', 'K', 0,0,0,0,0,0,0,0, NULL),
  ('COL', 'Colombia', 'https://flagcdn.com/w80/co.png', 'K', 0,0,0,0,0,0,0,0, NULL),
  ('ENG', 'Inglaterra', 'https://flagcdn.com/w80/gb-eng.png', 'L', 0,0,0,0,0,0,0,0, NULL),
  ('CRO', 'Croacia', 'https://flagcdn.com/w80/hr.png', 'L', 0,0,0,0,0,0,0,0, NULL),
  ('GHA', 'Ghana', 'https://flagcdn.com/w80/gh.png', 'L', 0,0,0,0,0,0,0,0, NULL),
  ('PAN', 'Panamá', 'https://flagcdn.com/w80/pa.png', 'L', 0,0,0,0,0,0,0,0, NULL)
ON CONFLICT (codigo) DO NOTHING;

-- ─── 2) PARTIDOS (72 de fase de grupos) ───
INSERT INTO public.partidos (id, fase, grupo, jornada, fecha_hora, sede, local, visitante, estado, event_id) VALUES
  ('p001', 'grupos', 'A', 1, '2026-06-11 16:00:00-03', 'Ciudad de México', 'MEX', 'RSA', 'programado', '8287'),
  ('p002', 'grupos', 'A', 1, '2026-06-11 23:00:00-03', 'Guadalajara', 'KOR', 'CZE', 'programado', '8288'),
  ('p003', 'grupos', 'A', 2, '2026-06-18 22:00:00-03', 'Atlanta', 'MEX', 'KOR', 'programado', '8311'),
  ('p004', 'grupos', 'A', 2, '2026-06-18 21:00:00-03', 'Guadalajara', 'RSA', 'CZE', 'programado', '8314'),
  ('p005', 'grupos', 'A', 3, '2026-06-24 21:00:00-03', 'Ciudad de México', 'MEX', 'CZE', 'programado', '8337'),
  ('p006', 'grupos', 'A', 3, '2026-06-24 22:00:00-03', 'Monterrey', 'RSA', 'KOR', 'programado', '8338'),
  ('p007', 'grupos', 'B', 1, '2026-06-12 16:00:00-03', 'Toronto', 'CAN', 'BIH', 'programado', '8289'),
  ('p008', 'grupos', 'B', 1, '2026-06-13 16:00:00-03', 'San Francisco', 'QAT', 'SUI', 'programado', '8292'),
  ('p009', 'grupos', 'B', 2, '2026-06-18 19:00:00-03', 'Los Ángeles', 'CAN', 'QAT', 'programado', '8312'),
  ('p010', 'grupos', 'B', 2, '2026-06-18 18:00:00-03', 'Vancouver', 'BIH', 'SUI', 'programado', '8313'),
  ('p011', 'grupos', 'B', 3, '2026-06-24 15:00:00-03', 'Vancouver', 'CAN', 'SUI', 'programado', '8335'),
  ('p012', 'grupos', 'B', 3, '2026-06-24 16:00:00-03', 'Seattle', 'BIH', 'QAT', 'programado', '8336'),
  ('p013', 'grupos', 'C', 1, '2026-06-13 19:00:00-03', 'Nueva York/NJ', 'BRA', 'MAR', 'programado', '8293'),
  ('p014', 'grupos', 'C', 1, '2026-06-13 21:00:00-03', 'Boston', 'SCO', 'HAI', 'programado', '8294'),
  ('p015', 'grupos', 'C', 2, '2026-06-19 15:00:00-03', 'Atlanta', 'BRA', 'SCO', 'programado', '8316'),
  ('p016', 'grupos', 'C', 2, '2026-06-24 19:00:00-03', 'Boston', 'MAR', 'HAI', 'programado', '8318'),
  ('p017', 'grupos', 'C', 3, '2026-06-19 21:30:00-03', 'Miami', 'BRA', 'HAI', 'programado', '8340'),
  ('p018', 'grupos', 'C', 3, '2026-06-25 15:00:00-03', 'Boston', 'MAR', 'SCO', 'programado', '8339'),
  ('p019', 'grupos', 'D', 1, '2026-06-12 22:00:00-03', 'Los Ángeles', 'USA', 'PAR', 'programado', '8290'),
  ('p020', 'grupos', 'D', 1, '2026-06-14 01:00:00-03', 'Vancouver', 'AUS', 'TUR', 'programado', '8291'),
  ('p021', 'grupos', 'D', 2, '2026-06-19 16:00:00-03', 'Seattle', 'USA', 'AUS', 'programado', '8317'),
  ('p022', 'grupos', 'D', 2, '2026-06-19 22:00:00-03', 'San Francisco', 'PAR', 'TUR', 'programado', '8315'),
  ('p023', 'grupos', 'D', 3, '2026-06-25 22:00:00-03', 'Los Ángeles', 'USA', 'TUR', 'programado', '8344'),
  ('p024', 'grupos', 'D', 3, '2026-06-25 23:00:00-03', 'Kansas City', 'PAR', 'AUS', 'programado', '8343'),
  ('p025', 'grupos', 'E', 1, '2026-06-14 14:00:00-03', 'Houston', 'GER', 'CUW', 'programado', '8295'),
  ('p026', 'grupos', 'E', 1, '2026-06-14 20:00:00-03', 'Filadelfia', 'CIV', 'ECU', 'programado', '8297'),
  ('p027', 'grupos', 'E', 2, '2026-06-20 17:00:00-03', 'Toronto', 'GER', 'CIV', 'programado', '8321'),
  ('p028', 'grupos', 'E', 2, '2026-06-20 20:00:00-03', 'Kansas City', 'CUW', 'ECU', 'programado', '8319'),
  ('p029', 'grupos', 'E', 3, '2026-06-25 16:00:00-03', 'Nueva York/NJ', 'GER', 'ECU', 'programado', '8342'),
  ('p030', 'grupos', 'E', 3, '2026-06-25 17:00:00-03', 'Filadelfia', 'CUW', 'CIV', 'programado', '8341'),
  ('p031', 'grupos', 'F', 1, '2026-06-14 17:00:00-03', 'Dallas', 'NED', 'JPN', 'programado', '8296'),
  ('p032', 'grupos', 'F', 1, '2026-06-14 23:00:00-03', 'Monterrey', 'SWE', 'TUN', 'programado', '8298'),
  ('p033', 'grupos', 'F', 2, '2026-06-20 14:00:00-03', 'Houston', 'NED', 'SWE', 'programado', '8320'),
  ('p034', 'grupos', 'F', 2, '2026-06-20 19:00:00-03', 'Dallas', 'JPN', 'TUN', 'programado', '8322'),
  ('p035', 'grupos', 'F', 3, '2026-06-26 16:00:00-03', 'Los Ángeles', 'NED', 'TUN', 'programado', '8345'),
  ('p036', 'grupos', 'F', 3, '2026-06-25 20:00:00-03', 'Kansas City', 'JPN', 'SWE', 'programado', '8346'),
  ('p037', 'grupos', 'G', 1, '2026-06-15 16:00:00-03', 'Atlanta', 'BEL', 'EGY', 'programado', '8300'),
  ('p038', 'grupos', 'G', 1, '2026-06-15 22:00:00-03', 'Los Ángeles', 'IRN', 'NZL', 'programado', '8301'),
  ('p039', 'grupos', 'G', 2, '2026-06-21 16:00:00-03', 'Boston', 'BEL', 'IRN', 'programado', '8323'),
  ('p040', 'grupos', 'G', 2, '2026-06-21 19:00:00-03', 'Seattle', 'EGY', 'NZL', 'programado', '8325'),
  ('p041', 'grupos', 'G', 3, '2026-06-26 19:00:00-03', 'Vancouver', 'BEL', 'NZL', 'programado', '8348'),
  ('p042', 'grupos', 'G', 3, '2026-06-27 00:00:00-03', 'San Francisco', 'EGY', 'IRN', 'programado', '8347'),
  ('p043', 'grupos', 'H', 1, '2026-06-15 13:00:00-03', 'Atlanta', 'ESP', 'CPV', 'programado', '8299'),
  ('p044', 'grupos', 'H', 1, '2026-06-15 19:00:00-03', 'Houston', 'KSA', 'URU', 'programado', '8302'),
  ('p045', 'grupos', 'H', 2, '2026-06-21 13:00:00-03', 'Nueva York/NJ', 'ESP', 'KSA', 'programado', '8324'),
  ('p046', 'grupos', 'H', 2, '2026-06-21 22:00:00-03', 'Miami', 'CPV', 'URU', 'programado', '8326'),
  ('p047', 'grupos', 'H', 3, '2026-06-26 22:00:00-03', 'Dallas', 'ESP', 'URU', 'programado', '8350'),
  ('p048', 'grupos', 'H', 3, '2026-06-26 21:00:00-03', 'Guadalajara', 'CPV', 'KSA', 'programado', '8349'),
  ('p049', 'grupos', 'I', 1, '2026-06-22 18:00:00-03', 'Los Ángeles', 'FRA', 'IRQ', 'programado', '8304'),
  ('p050', 'grupos', 'I', 1, '2026-06-16 19:00:00-03', 'Toronto', 'SEN', 'NOR', 'programado', '8305'),
  ('p051', 'grupos', 'I', 2, '2026-06-16 16:00:00-03', 'San Francisco', 'FRA', 'SEN', 'programado', '8327'),
  ('p052', 'grupos', 'I', 2, '2026-06-16 19:00:00-03', 'Atlanta', 'IRQ', 'NOR', 'programado', '8328'),
  ('p053', 'grupos', 'I', 3, '2026-06-27 10:00:00-03', 'Seattle', 'FRA', 'NOR', 'programado', '8351'),
  ('p054', 'grupos', 'I', 3, '2026-06-27 10:00:00-03', 'Nueva York/NJ', 'IRQ', 'SEN', 'programado', '8352'),
  ('p055', 'grupos', 'J', 1, '2026-06-16 22:00:00-03', 'Kansas City', 'ARG', 'ALG', 'programado', '8306'),
  ('p056', 'grupos', 'J', 1, '2026-06-17 01:00:00-03', 'Monterrey', 'AUT', 'JOR', 'programado', '8308'),
  ('p057', 'grupos', 'J', 2, '2026-06-22 14:00:00-03', 'Miami', 'ARG', 'AUT', 'programado', '8329'),
  ('p058', 'grupos', 'J', 2, '2026-06-22 22:00:00-03', 'San Francisco', 'ALG', 'JOR', 'programado', '8330'),
  ('p059', 'grupos', 'J', 3, '2026-06-27 22:00:00-03', 'Dallas', 'ARG', 'JOR', 'programado', '8356'),
  ('p060', 'grupos', 'J', 3, '2026-06-27 23:00:00-03', 'Kansas City', 'ALG', 'AUT', 'programado', '8355'),
  ('p061', 'grupos', 'K', 1, '2026-06-17 14:00:00-03', 'Houston', 'POR', 'COD', 'programado', '8303'),
  ('p062', 'grupos', 'K', 1, '2026-06-17 23:00:00-03', 'Ciudad de México', 'UZB', 'COL', 'programado', '8310'),
  ('p063', 'grupos', 'K', 2, '2026-06-23 14:00:00-03', 'Houston', 'POR', 'UZB', 'programado', '8331'),
  ('p064', 'grupos', 'K', 2, '2026-06-23 22:00:00-03', 'Guadalajara', 'COD', 'COL', 'programado', '8334'),
  ('p065', 'grupos', 'K', 3, '2026-06-27 19:30:00-03', 'Miami', 'POR', 'COL', 'programado', '8354'),
  ('p066', 'grupos', 'K', 3, '2026-06-27 20:30:00-03', 'Atlanta', 'COD', 'UZB', 'programado', '8353'),
  ('p067', 'grupos', 'L', 1, '2026-06-17 17:00:00-03', 'Dallas', 'ENG', 'CRO', 'programado', '8307'),
  ('p068', 'grupos', 'L', 1, '2026-06-17 20:00:00-03', 'Toronto', 'GHA', 'PAN', 'programado', '8309'),
  ('p069', 'grupos', 'L', 2, '2026-06-23 17:00:00-03', 'Boston', 'ENG', 'GHA', 'programado', '8332'),
  ('p070', 'grupos', 'L', 2, '2026-06-23 19:00:00-03', 'Toronto', 'CRO', 'PAN', 'programado', '8333'),
  ('p071', 'grupos', 'L', 3, '2026-06-28 17:00:00-03', 'Nueva York/NJ', 'ENG', 'PAN', 'programado', '8373'),
  ('p072', 'grupos', 'L', 3, '2026-06-27 18:00:00-03', 'Filadelfia', 'CRO', 'GHA', 'programado', '8374')
ON CONFLICT (id) DO NOTHING;

-- ─── 3) CONFIG mínima ───
INSERT INTO public.config (clave, valor) VALUES
  ('plan_empresa', 'plan_pro')
ON CONFLICT (clave) DO NOTHING;

-- ─── 4) Un área inicial (podés crear más desde el panel admin) ───
INSERT INTO public.areas (nombre, descripcion, activa)
SELECT 'General', 'Área general', true
WHERE NOT EXISTS (SELECT 1 FROM public.areas);

-- ─── Verificación ───
SELECT 'selecciones' t, count(*) FROM public.selecciones
UNION ALL SELECT 'partidos', count(*) FROM public.partidos
UNION ALL SELECT 'config', count(*) FROM public.config
UNION ALL SELECT 'areas', count(*) FROM public.areas;
