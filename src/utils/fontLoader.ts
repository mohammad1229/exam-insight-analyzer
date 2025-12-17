// Font loader utility for Arabic PDF support
// Loads the Amiri font from public folder and converts to base64

let cachedFont: string | null = null;

export async function loadAmiriFont(): Promise<string> {
  if (cachedFont) {
    return cachedFont;
  }

  try {
    const response = await fetch('/fonts/Amiri-Regular.ttf');
    if (!response.ok) {
      throw new Error('Failed to load Amiri font');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    cachedFont = base64;
    return base64;
  } catch (error) {
    console.error('Error loading Amiri font:', error);
    throw error;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const ARABIC_FONT_NAME = "Amiri";
