export interface UploadedImage {
  url: string;
  w?: number;
  h?: number;
}

/**
 * Shrink oversized photos in the browser before they go over the wire. A phone
 * shot is 5-9 MB; the server would downscale it to ≤1920px anyway, so sending
 * the full file only costs the author upload time on a campus connection.
 * Safari < 16.4 has no OffscreenCanvas — fall back to the original file.
 */
async function downscale(file: File): Promise<Blob> {
  if (file.size <= 2_000_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 2400;
    const ratio = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (ratio === 1) {
      bmp.close();
      return file;
    }
    const canvas = new OffscreenCanvas(Math.round(bmp.width * ratio), Math.round(bmp.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bmp.close();
      return file;
    }
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
  } catch {
    return file;
  }
}

/** Uploads one image and returns its URL plus intrinsic size. */
export async function uploadImage(file: File, onProgress?: (pct: number) => void): Promise<UploadedImage> {
  const body = await downscale(file);
  const fd = new FormData();
  fd.append('file', body, file.name.replace(/\.[^.]+$/, '') + '.webp');

  return new Promise<UploadedImage>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      let parsed: { url?: string; w?: number; h?: number; error?: string } = {};
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        /* fall through to the generic error below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && parsed.url) {
        resolve({ url: parsed.url, w: parsed.w, h: parsed.h });
      } else {
        reject(new Error(parsed.error ?? 'Не удалось загрузить фото'));
      }
    };
    xhr.onerror = () => reject(new Error('Нет связи с сервером'));
    xhr.send(fd);
  });
}

/** Uploads many files a few at a time; one bad file never loses the batch. */
export async function uploadImages(
  files: File[],
  onEach?: (img: UploadedImage) => void,
  onError?: (err: Error) => void
): Promise<UploadedImage[]> {
  const done: UploadedImage[] = [];
  const queue = [...files];
  const POOL = 3;

  await Promise.all(
    Array.from({ length: Math.min(POOL, queue.length) }, async () => {
      for (;;) {
        const file = queue.shift();
        if (!file) return;
        try {
          const img = await uploadImage(file);
          done.push(img);
          onEach?.(img);
        } catch (err) {
          onError?.(err instanceof Error ? err : new Error('Ошибка загрузки'));
        }
      }
    })
  );

  return done;
}
