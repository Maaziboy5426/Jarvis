import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import sax from 'sax';

// Initialize PDF worker
// In a real Vite app, you'd handle the worker URL more gracefully.
// For now, we'll try to set it to a CDN version matching the installed lib or a generic recent one.
// If this fails, PDF parsing might break. 
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export function getFileExtension(file) {
  const parts = file.name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function parseTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function readFileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

async function parsePdf(file) {
  try {
    const arrayBuffer = await readFileToArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText;
  } catch (e) {
    console.error("PDF Parse Error:", e);
    throw new Error("Failed to parse PDF content.");
  }
}

async function parseDocx(file) {
  try {
    const arrayBuffer = await readFileToArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  } catch (e) {
    console.error("DOCX Parse Error:", e);
    throw new Error("Failed to parse DOCX content.");
  }
}

async function parseExcel(file) {
  try {
    const arrayBuffer = await readFileToArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellNF: true });
    let fullText = '';

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      // Use sheet_to_json with headers for richer, summarization-friendly output
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false });
      if (json.length === 0) {
        fullText += `--- Sheet: ${sheetName} ---\n(Empty sheet)\n\n`;
        return;
      }
      // Format as readable table: first row as headers, then data rows with labels
      const rows = json.map(row => Array.isArray(row) ? row : [row]);
      const headerRow = rows[0];
      const dataRows = rows.slice(1).filter(r => r.some(c => c != null && String(c).trim() !== ''));
      fullText += `--- Sheet: ${sheetName} ---\n`;
      if (headerRow && headerRow.some(c => c != null && String(c).trim() !== '')) {
        fullText += `Headers: ${headerRow.map(c => String(c ?? '')).join(' | ')}\n\n`;
        dataRows.forEach((row, i) => {
          const cells = headerRow.map((h, j) => {
            const val = row[j];
            if (val == null || String(val).trim() === '') return '';
            return `${String(h).trim()}: ${String(val).trim()}`;
          }).filter(Boolean);
          if (cells.length > 0) {
            fullText += `Row ${i + 1}: ${cells.join(' · ')}\n`;
          }
        });
      } else {
        dataRows.forEach((row, i) => {
          const cells = row.map(c => c != null ? String(c).trim() : '').filter(Boolean);
          if (cells.length > 0) fullText += `Row ${i + 1}: ${cells.join(' | ')}\n`;
        });
      }
      fullText += '\n';
    });

    return fullText.trim() || 'No extractable content found.';
  } catch (e) {
    console.error("Excel Parse Error:", e);
    throw new Error("Failed to parse Excel content.");
  }
}

async function parsePptx(file) {
  try {
    const arrayBuffer = await readFileToArrayBuffer(file);
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files).filter((fn) => /ppt\/slides\/slide\d+\.xml$/i.test(fn));
    slideFiles.sort((a, b) => {
      const nA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const nB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return nA - nB;
    });

    let fullText = '';
    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = await zip.files[slideFiles[i]].async('string');
      const slideText = extractTextFromSlideXml(slideXml);
      fullText += `--- Slide ${i + 1} ---\n${slideText}\n\n`;
    }

    if (!fullText.trim()) {
      // Try to extract from presenter notes (ppt/notesSlides/notesSlide*.xml)
      const noteFiles = Object.keys(zip.files).filter((fn) => /ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(fn));
      for (let i = 0; i < noteFiles.length; i++) {
        const noteXml = await zip.files[noteFiles[i]].async('string');
        const noteText = extractTextFromSlideXml(noteXml);
        if (noteText.trim()) fullText += `--- Notes (Slide ${i + 1}) ---\n${noteText}\n\n`;
      }
    }

    return fullText.trim() || 'No text content found in presentation.';
  } catch (e) {
    console.error("PPTX Parse Error:", e);
    throw new Error("Failed to parse PowerPoint content.");
  }
}

function extractTextFromSlideXml(xml) {
  let text = '';
  const parser = sax.parser(true);
  parser.onopentag = (node) => {
    if (node.name === 'a:p' || node.name === 'a:br') text += '\n';
  };
  parser.ontext = (t) => {
    if (t && String(t).trim()) text += t;
  };
  parser.write(xml).close();
  return text.replace(/\n+/g, '\n').trim();
}

export async function parseFileToText(file) {
  if (!file) return '';
  const ext = getFileExtension(file);

  try {
    // Handle text-based files with full content extraction
    if (['txt', 'csv', 'json', 'md', 'xml', 'html', 'htm'].includes(ext)) {
      const raw = await parseTextFile(file);
      if (ext === 'json') {
        try {
          const obj = JSON.parse(raw);
          return JSON.stringify(obj, null, 2);
        } catch {
          return raw;
        }
      }
      return raw;
    }

    if (ext === 'pdf') {
      return await parsePdf(file);
    }

    if (ext === 'docx') {
      return await parseDocx(file);
    }

    if (['xlsx', 'xls', 'ods'].includes(ext)) {
      return await parseExcel(file);
    }

    if (ext === 'pptx') {
      return await parsePptx(file);
    }

    // If we can't parse it, return metadata context for AI inference (Rule: Result at all Costs)
    return `Context: File ${file.name} (${ext.toUpperCase()}). This appears to be a ${ext.toUpperCase()} document. Use the filename and type to infer its likely content and generate the requested output professionally.`;

  } catch (error) {
    console.error("Detailed parsing error:", error);
    return `Context: File ${file.name}. Content could not be fully extracted. Please generate a professional response based on the filename and user task.`;
  }
}

export async function extractFileMetadata(file) {
  const ext = getFileExtension(file);
  const sizeKb = (file.size / 1024).toFixed(1);
  const estimatedPages = estimatePagesFromSize(file.size, ext);
  const estimatedWords = estimateWordsFromSize(file.size, ext);

  return {
    name: file.name,
    type: ext.toUpperCase(),
    size: `${sizeKb} KB`,
    pages: estimatedPages,
    words: estimatedWords,
    isTextFile: ['txt', 'csv', 'json', 'md', 'xml', 'html', 'htm', 'pdf', 'docx', 'xlsx', 'xls', 'pptx'].includes(ext),
    lastModified: file.lastModified
  };
}

function estimatePagesFromSize(bytes, fileType) {
  // Rough estimations based on typical file sizes
  const sizeKb = bytes / 1024;

  switch (fileType.toLowerCase()) {
    case 'pdf':
      // PDFs: ~50-200 KB per page typically
      return Math.max(1, Math.round(sizeKb / 100));
    case 'docx':
      // Word docs: ~20-100 KB per page
      return Math.max(1, Math.round(sizeKb / 50));
    case 'xlsx':
      // Excel: highly variable, estimate based on data density
      return Math.max(1, Math.round(sizeKb / 30));
    case 'pptx':
      // PowerPoint: ~100-300 KB per presentation
      return Math.max(1, Math.round(sizeKb / 150));
    case 'txt':
      // Text: ~2-5 KB per page
      return Math.max(1, Math.round(sizeKb / 3));
    default:
      return Math.max(1, Math.round(sizeKb / 50));
  }
}

function estimateWordsFromSize(bytes, fileType) {
  const pages = estimatePagesFromSize(bytes, fileType);

  switch (fileType.toLowerCase()) {
    case 'pdf':
      return pages * 400; // ~400 words per page
    case 'docx':
      return pages * 350; // ~350 words per page
    case 'xlsx':
      return pages * 200; // ~200 data points/cells per page equivalent
    case 'pptx':
      return pages * 150; // ~150 words per slide
    case 'txt':
      return pages * 300; // ~300 words per page
    default:
      return pages * 300;
  }
}