import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

interface ExtractedLineItem {
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
}

export interface ExtractedInvoiceResult {
  vendorName: string;
  vendorGstin?: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: 'INR' | 'USD';
  exchangeRate: number;
  taxMode: 'exclusive' | 'inclusive';
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  lineItems: ExtractedLineItem[];
  isPossibleDuplicate: boolean;
  duplicateDetails?: string;
  rawTextPreview?: string;
}

export async function extractInvoiceData(
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<ExtractedInvoiceResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert IT invoice parser and accountant. Extract structured billing and tax data from this document.
Follow these strict classification rules:
- Products mentioning "Courier Label" or "Shipping Label" -> category "courier-labels"
- Products mentioning "Wax Roll" or "Wax Ribbon" (and NOT barcode wax) -> category "wax-rolls"
- Products mentioning "Barcode Roll" or "Barcode Label" -> category "barcode-rolls"
- Products mentioning "Barcode Wax" or "Wax Resin" -> category "barcode-wax-rolls"
- "Render" or "Render.com" -> category "render", currency USD if billed in dollars
- "MongoDB" or "Atlas" -> category "mongodb", currency USD if billed in dollars
- Computer, Laptop, RAM, Monitor, Printer, UPS, Cable, Toner, Software, Minop, TrackingMore -> category "other"

Determine GST:
- In India, if vendor state matches customer state (e.g. Karnataka to Karnataka), CGST = GST/2 and SGST = GST/2, IGST = 0.
- If inter-state, IGST = Total Tax, CGST = 0, SGST = 0.
- If USD foreign invoice, tax is 0%.

Return ONLY valid JSON with this exact structure:
{
  "vendorName": string,
  "vendorGstin": string,
  "invoiceNumber": string,
  "invoiceDate": "YYYY-MM-DD",
  "currency": "INR" or "USD",
  "exchangeRate": number (1 for INR, 0 when no rate is available),
  "taxMode": "exclusive" or "inclusive",
  "subtotal": number,
  "totalTax": number,
  "grandTotal": number,
  "lineItems": [
    {
      "productName": string,
      "category": string,
      "quantity": number,
      "unit": string,
      "unitPrice": number,
      "taxableAmount": number,
      "gstRate": number,
      "cgst": number,
      "sgst": number,
      "igst": number,
      "totalTax": number,
      "totalAmount": number
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: fileBase64,
                  mimeType: mimeType || 'image/jpeg',
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);

      // Check duplicates in existing MongoDB records
      const duplicate = checkForDuplicate(parsed.vendorName, parsed.invoiceNumber, parsed.grandTotal);

      return {
        ...parsed,
        isPossibleDuplicate: duplicate.isDuplicate,
        duplicateDetails: duplicate.details,
      };
    } catch (err) {
      console.warn('Gemini invoice extraction encountered an error, falling back to heuristic extractor:', err);
    }
  }

  throw new Error("Invoice extraction failed. Configure GEMINI_API_KEY and try again.");
}

function checkForDuplicate(vendorName: string, invoiceNumber: string, grandTotal: number): { isDuplicate: boolean; details?: string } {
  if (!invoiceNumber) return { isDuplicate: false };

  const expenses = db.getExpenses();
  const match = expenses.find(
    (e) =>
      e.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase() ||
      (e.vendorName.toLowerCase().includes(vendorName.toLowerCase()) && Math.abs(e.totalAmount - grandTotal) < 1)
  );

  if (match) {
    return {
      isDuplicate: true,
      details: `Warning: Matched existing expense ${match.expenseNumber} with Invoice #${match.invoiceNumber} (Amount: ₹${match.totalAmount})`,
    };
  }

  return { isDuplicate: false };
}

