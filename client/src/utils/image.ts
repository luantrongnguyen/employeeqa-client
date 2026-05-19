const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const validateImage = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'imageTypeError'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'imageSizeError'
  }
  return null
}

export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file)
}

export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url)
}
