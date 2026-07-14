export function compressImage(
  file: File,
  maxW = 400,
  maxH = 400,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function compressBanner(
  file: File,
  maxW = 1024,
  maxH = 320,
  quality = 0.65
): Promise<string> {
  return compressImage(file, maxW, maxH, quality)
}

export function compressAvatar(
  file: File,
  maxW = 256,
  maxH = 256,
  quality = 0.75
): Promise<string> {
  return compressImage(file, maxW, maxH, quality)
}
