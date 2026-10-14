'use client';
// Uploaded files live as Blobs in IndexedDB (keyed by Asset.id) so they survive a refresh; localStorage only
// holds the 'idb:<id>' reference. No dependency. Remote and /public URLs pass straight through useAssetUrl.
import { useEffect, useState } from 'react';
import type { Asset } from './types';

const DB = 'gip-admin-media', STORE = 'blobs';
let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbp = null; reject(req.error); };
  });
  return dbp;
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function imageSize(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch { return {}; }
}

/** saveUpload's rejection when the browser won't keep the file (IndexedDB blocked, private mode, or full). */
export class UploadStorageError extends Error {
  readonly quota: boolean;
  constructor(cause: unknown) {
    const quota = cause instanceof DOMException && cause.name === 'QuotaExceededError';
    super(quota ? 'Browser storage is full.' : "This browser isn't letting the demo store files.", { cause });
    this.name = 'UploadStorageError';
    this.quota = quota;
  }
}

/** Stores the file and returns an Asset whose url is 'idb:<id>'. Rejects with UploadStorageError. */
export async function saveUpload(file: File): Promise<Asset> {
  const id = `up-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const kind: Asset['kind'] = file.type === 'application/pdf' ? 'pdf' : 'image';
  const size = kind === 'image' ? await imageSize(file) : {};
  try {
    await run('readwrite', (s) => s.put(file, id));
  } catch (e) {
    throw new UploadStorageError(e);
  }
  return { id, url: `idb:${id}`, kind, name: file.name, ...size, source: 'upload' };
}

export async function deleteUpload(id: string): Promise<void> {
  await run('readwrite', (s) => s.delete(id));
}

/**
 * Displayable URL for an asset: object URL for 'idb:' uploads (revoked on change/unmount), otherwise asset.url.
 * undefined = an upload still loading; null = no asset, or its file is gone from this browser.
 */
export function useAssetUrl(asset: Asset | null | undefined): string | null | undefined {
  const url = asset?.url ?? null;
  const id = url?.startsWith('idb:') ? url.slice(4) : null;
  const [loaded, setLoaded] = useState<{ id: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!id) return;
    let objectUrl: string | null = null, cancelled = false;
    run<Blob | undefined>('readonly', (s) => s.get(id))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = blob ? URL.createObjectURL(blob) : null;
        setLoaded({ id, url: objectUrl });
      })
      .catch(() => { if (!cancelled) setLoaded({ id, url: null }); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  if (!id) return url;
  return loaded?.id === id ? loaded.url : undefined;
}
