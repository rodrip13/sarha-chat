/**
 * Logger utility para desarrollo
 * Desactiva todos los logs cuando DEBUG_MODE = false
 */

const DEBUG_MODE = import.meta.env.DEV; // Solo true en desarrollo (npm run dev)

export const logger = {
  info: (label: string, message?: any) => {
    if (DEBUG_MODE) console.log(label, message);
  },
  warn: (label: string, message?: any) => {
    if (DEBUG_MODE) console.warn(label, message);
  },
  error: (label: string, message?: any) => {
    if (DEBUG_MODE) console.error(label, message);
  },
};
