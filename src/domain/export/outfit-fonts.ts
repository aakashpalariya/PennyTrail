let cachedOutfitRegular: string | null = null;
let cachedOutfitBold: string | null = null;

/**
 * Loads and caches Google Outfit TTF font files as base64 for jsPDF vector rendering.
 */
export async function loadOutfitFonts(): Promise<{ regular: string; bold: string } | null> {
  if (cachedOutfitRegular && cachedOutfitBold) {
    return { regular: cachedOutfitRegular, bold: cachedOutfitBold };
  }

  try {
    const [regRes, boldRes] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-400-normal.ttf'),
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.ttf'),
    ]);

    if (!regRes.ok || !boldRes.ok) return null;

    const [regBuf, boldBuf] = await Promise.all([
      regRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);

    const toBase64 = (buf: ArrayBuffer): string => {
      let binary = '';
      const bytes = new Uint8Array(buf);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    cachedOutfitRegular = toBase64(regBuf);
    cachedOutfitBold = toBase64(boldBuf);

    return { regular: cachedOutfitRegular, bold: cachedOutfitBold };
  } catch (err) {
    console.warn('Could not load Outfit web font for PDF, falling back to default:', err);
    return null;
  }
}
