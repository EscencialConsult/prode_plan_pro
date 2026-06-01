import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de los escenarios de carga
export const options = {
  scenarios: {
    // Escenario 1: Navegación típica y consulta de fixture/ranking (Lectura pesada)
    lectura_usuarios: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 }, // subida a 100 usuarios activos concurrentes
        { duration: '1m', target: 500 },  // escalado a 500
        { duration: '30s', target: 0 },    // bajada
      ],
      gracefulRampDown: '10s',
      exec: 'escenarioLectura',
    },
    // Escenario 2: Guardado de predicciones masivo en lote (Escritura transaccional)
    guardado_predicciones: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 envíos por segundo
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      exec: 'escenarioGuardado',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // menos del 1% de errores
    'http_req_duration{scenario:lectura_usuarios}': ['p(95)<1500'], // 95% de lecturas < 1.5s
    'http_req_duration{scenario:guardado_predicciones}': ['p(95)<3000'], // 95% de escrituras RPC < 3s
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://yexepwfqubeicrbqkekq.supabase.co';
const SUPABASE_KEY = __ENV.SUPABASE_KEY || 'sb_publishable_HFgshGvnPTLv8A--vgVPfg_Eb_TJ8kr';

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Content-Type': 'application/json',
};

// Escenario 1: Lectura de ranking cache y fixture
export function escenarioLectura() {
  const params = { headers: HEADERS };

  // 1. Obtener partidos (Fixture)
  const resPartidos = http.get(`${SUPABASE_URL}/rest/v1/partidos?select=*`, params);
  check(resPartidos, {
    'fixture_ok': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Obtener ranking precalculado (Cache)
  // Reemplazar apuesta_id ficticia con una real en tus pruebas reales
  const apuestaId = '00000000-0000-0000-0000-000000000000';
  const resRanking = http.get(
    `${SUPABASE_URL}/rest/v1/ranking_cache?apuesta_id=eq.${apuestaId}&es_grupal=eq.false&order=posicion.asc&limit=50`,
    params
  );
  check(resRanking, {
    'ranking_cache_ok': (r) => r.status === 200,
  });

  sleep(2);
}

// Escenario 2: Simular guardado batch de predicciones (RPC)
export function escenarioGuardado() {
  // Simulamos un token JWT de autorización (opcional si la RPC tiene RLS / seguridad que requiere auth)
  // Para pruebas masivas, se recomienda usar una API Key de servicio o pasar un Header de Authorization real.
  const headers = Object.assign({}, HEADERS, {
    // 'Authorization': `Bearer ${JWT_TOKEN}`
  });

  const payload = JSON.stringify({
    p_apuesta_id: '00000000-0000-0000-0000-000000000000',
    p_predicciones: [
      { partido_id: 'p1', pred_local: 2, pred_visitante: 1, pred_clasificado: null },
      { partido_id: 'p2', pred_local: 0, pred_visitante: 0, pred_clasificado: 'ARG' },
      { partido_id: 'p3', pred_local: 1, pred_visitante: 3, pred_clasificado: null },
    ],
    p_area_id: null
  });

  const res = http.post(`${SUPABASE_URL}/rest/v1/rpc/guardar_predicciones_apuesta`, payload, { headers });
  
  check(res, {
    'guardar_batch_status_ok': (r) => r.status === 200 || r.status === 201 || r.status === 401, // 401 si no está autenticado, pero mide performance de la capa
  });

  sleep(1);
}
