export interface LocalRecording {
  id: string
  createdAt: number
  label: string
  blob: Blob
  durationSeconds: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('party-box:recordings', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('clips', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Recording database blocked'))
  })
}

async function transact<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('clips', mode)
    const request = operation(transaction.objectStore('clips'))
    transaction.oncomplete = () => { db.close(); resolve(request.result) }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('Recording transaction aborted')) }
  })
}

export async function saveRecording(clip: LocalRecording): Promise<void> {
  await transact('readwrite', store => store.put(clip))
}

export async function listRecordings(): Promise<LocalRecording[]> {
  return (await transact('readonly', store => store.getAll()) as LocalRecording[]).sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteRecording(id: string): Promise<void> {
  await transact('readwrite', store => store.delete(id))
}

export function recordingFilename(clip: LocalRecording): string {
  return `PartyBox-${clip.createdAt}.${clip.blob.type.includes('mp4') ? 'mp4' : 'webm'}`
}
