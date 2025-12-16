// Arabic PDF Utilities
// Helper functions for Arabic text rendering in jsPDF

// Simple Arabic reshaper for common characters
// Maps isolated Arabic characters to their proper contextual forms
const arabicMap: { [key: string]: { isolated: string; initial: string; medial: string; final: string } } = {
  'ا': { isolated: '\uFE8D', initial: '\uFE8D', medial: '\uFE8E', final: '\uFE8E' },
  'أ': { isolated: '\uFE83', initial: '\uFE83', medial: '\uFE84', final: '\uFE84' },
  'إ': { isolated: '\uFE87', initial: '\uFE87', medial: '\uFE88', final: '\uFE88' },
  'آ': { isolated: '\uFE81', initial: '\uFE81', medial: '\uFE82', final: '\uFE82' },
  'ب': { isolated: '\uFE8F', initial: '\uFE91', medial: '\uFE92', final: '\uFE90' },
  'ت': { isolated: '\uFE95', initial: '\uFE97', medial: '\uFE98', final: '\uFE96' },
  'ث': { isolated: '\uFE99', initial: '\uFE9B', medial: '\uFE9C', final: '\uFE9A' },
  'ج': { isolated: '\uFE9D', initial: '\uFE9F', medial: '\uFEA0', final: '\uFE9E' },
  'ح': { isolated: '\uFEA1', initial: '\uFEA3', medial: '\uFEA4', final: '\uFEA2' },
  'خ': { isolated: '\uFEA5', initial: '\uFEA7', medial: '\uFEA8', final: '\uFEA6' },
  'د': { isolated: '\uFEA9', initial: '\uFEA9', medial: '\uFEAA', final: '\uFEAA' },
  'ذ': { isolated: '\uFEAB', initial: '\uFEAB', medial: '\uFEAC', final: '\uFEAC' },
  'ر': { isolated: '\uFEAD', initial: '\uFEAD', medial: '\uFEAE', final: '\uFEAE' },
  'ز': { isolated: '\uFEAF', initial: '\uFEAF', medial: '\uFEB0', final: '\uFEB0' },
  'س': { isolated: '\uFEB1', initial: '\uFEB3', medial: '\uFEB4', final: '\uFEB2' },
  'ش': { isolated: '\uFEB5', initial: '\uFEB7', medial: '\uFEB8', final: '\uFEB6' },
  'ص': { isolated: '\uFEB9', initial: '\uFEBB', medial: '\uFEBC', final: '\uFEBA' },
  'ض': { isolated: '\uFEBD', initial: '\uFEBF', medial: '\uFEC0', final: '\uFEBE' },
  'ط': { isolated: '\uFEC1', initial: '\uFEC3', medial: '\uFEC4', final: '\uFEC2' },
  'ظ': { isolated: '\uFEC5', initial: '\uFEC7', medial: '\uFEC8', final: '\uFEC6' },
  'ع': { isolated: '\uFEC9', initial: '\uFECB', medial: '\uFECC', final: '\uFECA' },
  'غ': { isolated: '\uFECD', initial: '\uFECF', medial: '\uFED0', final: '\uFECE' },
  'ف': { isolated: '\uFED1', initial: '\uFED3', medial: '\uFED4', final: '\uFED2' },
  'ق': { isolated: '\uFED5', initial: '\uFED7', medial: '\uFED8', final: '\uFED6' },
  'ك': { isolated: '\uFED9', initial: '\uFEDB', medial: '\uFEDC', final: '\uFEDA' },
  'ل': { isolated: '\uFEDD', initial: '\uFEDF', medial: '\uFEE0', final: '\uFEDE' },
  'م': { isolated: '\uFEE1', initial: '\uFEE3', medial: '\uFEE4', final: '\uFEE2' },
  'ن': { isolated: '\uFEE5', initial: '\uFEE7', medial: '\uFEE8', final: '\uFEE6' },
  'ه': { isolated: '\uFEE9', initial: '\uFEEB', medial: '\uFEEC', final: '\uFEEA' },
  'و': { isolated: '\uFEED', initial: '\uFEED', medial: '\uFEEE', final: '\uFEEE' },
  'ي': { isolated: '\uFEF1', initial: '\uFEF3', medial: '\uFEF4', final: '\uFEF2' },
  'ى': { isolated: '\uFEEF', initial: '\uFEEF', medial: '\uFEF0', final: '\uFEF0' },
  'ة': { isolated: '\uFE93', initial: '\uFE93', medial: '\uFE94', final: '\uFE94' },
  'ء': { isolated: '\uFE80', initial: '\uFE80', medial: '\uFE80', final: '\uFE80' },
  'ؤ': { isolated: '\uFE85', initial: '\uFE85', medial: '\uFE86', final: '\uFE86' },
  'ئ': { isolated: '\uFE89', initial: '\uFE8B', medial: '\uFE8C', final: '\uFE8A' },
};

// Characters that don't connect to the next character
const nonConnectingChars = ['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ء', 'ة', 'ى'];

// Check if character is Arabic
const isArabicChar = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) || (code >= 0xFE70 && code <= 0xFEFF);
};

// Reshape Arabic text for proper display
export const reshapeArabic = (text: string): string => {
  if (!text) return text;
  
  const chars = text.split('');
  let result = '';
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const prevChar = i > 0 ? chars[i - 1] : null;
    const nextChar = i < chars.length - 1 ? chars[i + 1] : null;
    
    if (arabicMap[char]) {
      const prevIsArabic = prevChar && isArabicChar(prevChar) && !nonConnectingChars.includes(prevChar);
      const nextIsArabic = nextChar && isArabicChar(nextChar);
      
      let form: 'isolated' | 'initial' | 'medial' | 'final' = 'isolated';
      
      if (prevIsArabic && nextIsArabic) {
        form = 'medial';
      } else if (prevIsArabic) {
        form = 'final';
      } else if (nextIsArabic) {
        form = 'initial';
      }
      
      result += arabicMap[char][form];
    } else {
      result += char;
    }
  }
  
  return result;
};

// Reverse text for RTL display in PDF (jsPDF renders LTR by default)
export const reverseForRTL = (text: string): string => {
  // Split by words to handle mixed content
  const words = text.split(' ');
  return words.reverse().join(' ');
};

// Process Arabic text: reshape and reverse
export const processArabicText = (text: string): string => {
  const reshaped = reshapeArabic(text);
  return reverseForRTL(reshaped);
};

// Check if text contains Arabic
export const containsArabic = (text: string): boolean => {
  return /[\u0600-\u06FF\uFE70-\uFEFF]/.test(text);
};

// Format text for PDF - handles mixed Arabic/English
export const formatForPdf = (text: string): string => {
  if (!containsArabic(text)) {
    return text;
  }
  
  // For simple Arabic text, process it
  if (containsArabic(text)) {
    return processArabicText(text);
  }
  
  return text;
};
