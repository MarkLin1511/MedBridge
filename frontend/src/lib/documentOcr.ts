export interface DocumentOcrResult {
  text: string;
  method: string;
}

async function ocrImage(file: File): Promise<DocumentOcrResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(file);
    return {
      text: result.data.text.trim(),
      method: "browser_image_ocr",
    };
  } finally {
    await worker.terminate();
  }
}

export async function extractDocumentTextInBrowser(file: File): Promise<DocumentOcrResult | null> {
  if (file.type.startsWith("image/")) {
    return ocrImage(file);
  }

  return null;
}
