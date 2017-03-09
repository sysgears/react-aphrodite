import Inject from 'wrap!aphrodite/lib/inject';

/**
 * Creates new isolated Aphrodite instance, for using on server side
 */
export function createInstance() {
  return new Inject();
}

/**
 * Global client-side Aphrodite instance
 */
export const clientInstance = createInstance();
