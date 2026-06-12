/* ── Logger Central ─────────────────────────────────────────
   Logging condicionado al entorno. En producción no emite nada
   a la consola; en desarrollo (import.meta.env.DEV) reenvía a
   los métodos nativos de console.

   Uso:
     import { logger } from '../utils/logger.js'
     logger.error('Error guardando:', err)
     logger.warn('Storage casi lleno')
     logger.info('Fixture actualizado')
   ─────────────────────────────────────────────────────────── */

const isDev = Boolean(import.meta.env?.DEV)

const noop = () => {}

export const logger = {
  error: isDev ? console.error.bind(console) : noop,
  warn:  isDev ? console.warn.bind(console)  : noop,
  info:  isDev ? console.info.bind(console)  : noop,
}
