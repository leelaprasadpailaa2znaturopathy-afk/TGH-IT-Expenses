import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { User, ExpenseItem } from '../types';

interface ExcelCenterProps {
  currentUser: User;
  expenses: ExpenseItem[];
  onImportSuccess: () => void;
  onNavigate: (page: string) => void;
}

export const ExcelCenter: React.FC<ExcelCenterProps> = ({
  currentUser,
  expenses,
  onImportSuccess,
  onNavigate,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    setIsParsing(true);
    setPreviewResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1] || '';
        const res = await api.previewExcelImport(base64Data);
        setPreviewResult(res);
      } catch (err: any) {
        alert(`Failed to parse Excel file: ${err.message}`);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      alert('Error reading uploaded file');
      setIsParsing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmImport = async () => {
    if (!previewResult || !previewResult.validRows || previewResult.validRows.length === 0) {
      return alert('No valid rows found to import');
    }

    setIsCommitting(true);
    try {
      const res = await api.confirmExcelImport(previewResult.validRows, currentUser);
      alert(`Import successfully committed! ${res.count} historical transactions saved.`);
      setPreviewResult(null);
      onImportSuccess();
      onNavigate('transactions');
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const downloadSampleTemplate = () => {
    window.location.href = '/api/excel/export/original';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Excel Import &amp; Export Center</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          Import legacy spreadsheets with automatic column mapping, anomaly detection, and schema validation. Export either the 16-column standard spreadsheet format or the multi-sheet executive workbook.
        </p>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Download Excel Exports (Two Standard Formats)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Format A */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Export Format A: Original Spreadsheet</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  Exact 16 Columns
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Preserves exact historical column order: Responsible Person, Date, Item Purchased, Purchased By, Designation, Quantity, Unit Price, Without Tax, Total Amount, Vendor, Purpose, Payment Method, Invoice No, Approved By, Approval Date, Remarks.
              </p>
            </div>

            <a
              href="/api/excel/export/original"
              download="IT_Expenses_Original_Format.xlsx"
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download IT_Expenses_Original_Format.xlsx</span>
            </a>
          </div>

          {/* Format B */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Export Format B: Professional Multi-Sheet Report</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  14 Worksheets
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Comprehensive workbook containing independent sheets: Dashboard Summary, All Transactions, Courier Labels, Wax Rolls, Barcode Rolls, Barcode Wax Rolls, Render Hosting, MongoDB, Other Bills, Inventory, Assets, Subscriptions.
              </p>
            </div>

            <a
              href="/api/excel/export/professional"
              download="IT_Expenses_Professional_Report.xlsx"
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download IT_Expenses_Professional_Report.xlsx</span>
            </a>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Excel Spreadsheet Import
          </h3>
          <button
            onClick={downloadSampleTemplate}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Download Sample Test Spreadsheet
          </button>
        </div>

        {!previewResult && (
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-950/40 transition-colors">
            {isParsing ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300">Parsing spreadsheet rows and inspecting anomalies...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Upload Excel Spreadsheet (.xlsx, .xls, .csv)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Requires Invoice ID column. Dates and currency rates will be locked to purchase dates.
                  </p>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 shadow-xs transition-colors">
                  <span>Select File</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Import Preview & Anomaly Flags */}
        {previewResult && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>Total Rows: <strong className="text-slate-900 dark:text-slate-100">{previewResult.totalRows}</strong></span>
                <span>Valid: <strong className="text-emerald-600 dark:text-emerald-400">{previewResult.validRows.length}</strong></span>
                <span>Anomalies: <strong className="text-amber-600 dark:text-amber-400">{previewResult.anomalies.length}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewResult(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={isCommitting}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isCommitting ? 'Importing...' : 'Commit Valid Rows'}</span>
                </button>
              </div>
            </div>

            {/* Anomalies Box */}
            {previewResult.anomalies.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-600/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Data Quality Anomalies Identified</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2 font-mono text-[11px]">
                  {previewResult.anomalies.map((a: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-white dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/40 text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>Row {a.row}: {a.reason}</span>
                      <span className="text-amber-600 dark:text-amber-400">{a.item ? a.item['productName'] || a.item['Item / Service Purchased'] : 'Blank'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid Rows Sample Preview */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3">Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {previewResult.validRows.slice(0, 8).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{row.purchaseDate}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-slate-100 font-sans font-medium">{row.productName}</td>
                      <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">{row.category}</td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">{row.quantity}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{row.totalAmount}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">{row.vendorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
