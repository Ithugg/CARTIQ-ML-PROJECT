/**
 * Strips undefined values from an object before writing to Firestore.
 * Firestore rejects documents containing `undefined` — this ensures safety.
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
