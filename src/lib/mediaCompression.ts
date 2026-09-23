const MAX_MEDIA_BYTES = 15 * 1024 * 1024;

function canvasToFile(canvas: HTMLCanvasElement, name: string, type: string, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Browser tidak dapat mengompres gambar.'));
        return;
      }
      resolve(new File([blob], name, { type: blob.type || type }));
    }, type, quality);
  });
}

export async function compressMedia(file: File): Promise<File> {
  if (file.size <= MAX_MEDIA_BYTES) return file;

  if (file.type === 'image/gif') {
    throw new Error('GIF lebih dari 15 MB tidak dapat dikompres tanpa menghilangkan animasinya. Pilih GIF yang lebih kecil.');
  }

  if (file.type.startsWith('video/')) {
    throw new Error('Video lebih dari 15 MB belum dapat dikompres di browser. Pilih video maksimal 15 MB.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Ukuran media maksimal 15 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Gambar tidak dapat dibaca.'));
      image.src = objectUrl;
    });

    const maxDimension = 2048;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser tidak mendukung kompresi gambar.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.86;
    let compressed = await canvasToFile(canvas, file.name.replace(/\.[^.]+$/, '.jpg'), 'image/jpeg', quality);
    while (compressed.size > MAX_MEDIA_BYTES && quality > 0.35) {
      quality -= 0.1;
      compressed = await canvasToFile(canvas, file.name.replace(/\.[^.]+$/, '.jpg'), 'image/jpeg', quality);
    }
    if (compressed.size > MAX_MEDIA_BYTES) throw new Error('Gambar tetap lebih dari 15 MB setelah dikompres.');
    return compressed;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
