/**
 * Device-local check-ins (IndexedDB), keyed by user id.
 * Unsynced rows are merged into history; synced mirrors are optional backup and are not listed.
 */

const DB_NAME = 'emotion_assistant_checkins'
const DB_VERSION = 1
const STORE = 'entries'

export type LocalCheckInPayload = Record<string, unknown>

export type LocalCheckInRecord = {
  localId: string
  userId: number
  payload: LocalCheckInPayload
  synced: boolean
  serverId: number | null
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'localId' })
        store.createIndex('byUser', 'userId', { unique: false })
        store.createIndex('byUserSynced', ['userId', 'synced'], { unique: false })
      }
    }
  })
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })
}

export function isLocalRouteId(id: string): boolean {
  return id.startsWith('local-')
}

export function parseLocalRouteId(routeId: string): string | null {
  if (!isLocalRouteId(routeId)) return null
  return routeId.slice('local-'.length)
}

export async function addLocalCheckIn(userId: number, payload: LocalCheckInPayload): Promise<string> {
  const localId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const db = await openDb()
  const record: LocalCheckInRecord = {
    localId,
    userId,
    payload: { ...payload },
    synced: false,
    serverId: null,
    createdAt: Date.now(),
  }
  await reqToPromise(db.transaction(STORE, 'readwrite').objectStore(STORE).add(record))
  db.close()
  return localId
}

/** After successful cloud create (hybrid / backup). Not shown in merged history. */
export async function addSyncedMirror(userId: number, serverId: number, payload: LocalCheckInPayload): Promise<void> {
  const localId = `synced-${serverId}`
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const record: LocalCheckInRecord = {
    localId,
    userId,
    payload: { ...payload },
    synced: true,
    serverId,
    createdAt: Date.now(),
  }
  await reqToPromise(store.put(record))
  db.close()
}

export async function getPendingLocalEntries(userId: number): Promise<LocalCheckInRecord[]> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const store = tx.objectStore(STORE)
  const index = store.index('byUser')
  const rows: LocalCheckInRecord[] = []
  await new Promise<void>((resolve, reject) => {
    const r = index.openCursor(IDBKeyRange.only(userId))
    r.onerror = () => reject(r.error)
    r.onsuccess = () => {
      const cursor = r.result
      if (!cursor) {
        resolve()
        return
      }
      const rec = cursor.value as LocalCheckInRecord
      if (!rec.synced) rows.push(rec)
      cursor.continue()
    }
  })
  db.close()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getLocalCheckIn(userId: number, localId: string): Promise<LocalCheckInRecord | null> {
  const db = await openDb()
  const rec = (await reqToPromise(db.transaction(STORE, 'readonly').objectStore(STORE).get(localId))) as
    | LocalCheckInRecord
    | undefined
  db.close()
  if (!rec || rec.userId !== userId) return null
  return rec
}

export async function deleteLocalCheckIn(userId: number, localId: string): Promise<void> {
  const db = await openDb()
  const rec = (await reqToPromise(db.transaction(STORE, 'readonly').objectStore(STORE).get(localId))) as
    | LocalCheckInRecord
    | undefined
  if (rec && rec.userId === userId) {
    await reqToPromise(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(localId))
  }
  db.close()
}

export async function markLocalCheckInSynced(localId: string, serverId: number): Promise<void> {
  const db = await openDb()
  const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
  const rec = (await reqToPromise(store.get(localId))) as LocalCheckInRecord | undefined
  if (rec) {
    rec.synced = true
    rec.serverId = serverId
    await reqToPromise(store.put(rec))
  }
  db.close()
}

export type SyncResult = { uploaded: number; failed: number; errors: string[] }

export async function syncPendingLocalToCloud(
  userId: number,
  upload: (payload: LocalCheckInPayload) => Promise<{ id: number }>
): Promise<SyncResult> {
  const pending = await getPendingLocalEntries(userId)
  const result: SyncResult = { uploaded: 0, failed: 0, errors: [] }
  for (const row of pending) {
    try {
      const created = await upload(row.payload)
      await markLocalCheckInSynced(row.localId, created.id)
      result.uploaded += 1
    } catch (e) {
      result.failed += 1
      result.errors.push(e instanceof Error ? e.message : 'Upload failed')
    }
  }
  return result
}

export function countPendingLocal(userId: number): Promise<number> {
  return getPendingLocalEntries(userId).then((r) => r.length)
}
