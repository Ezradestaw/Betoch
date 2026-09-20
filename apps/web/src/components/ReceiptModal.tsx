// ==============================================================================
// BETOCH DIGITAL RECEIPT COMPONENT
// Proclamation No. 1320/2024 Compliant Ethiopian Rental Payment Receipt
// ==============================================================================

import React from 'react';
import { Printer, Download, CheckCircle, ShieldCheck, X, Building } from 'lucide-react';

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  payerName: string;
  payerPhone?: string;
  landlordName: string;
  propertyTitle: string;
  propertyAddress: string;
  monthlyRent: number;
  depositMonths: number;
  depositAmount: number;
  serviceFee?: number;
  totalPaid: number;
  contractRegistrationNo?: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Official Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 sm:p-10 overflow-y-auto flex-1 font-sans bg-white print:p-0 print:m-0" id="receipt-print-area">
          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-slate-950">BETOCH</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">ቤቶች</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Ethiopian Ministry of Urban Development & Housing Compliance
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Proclamation No. 1320/2024 Residential Rental Escrow
              </p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full mb-1">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                VERIFIED PAYMENT
              </span>
              <p className="text-xs font-mono font-bold text-slate-900">Receipt: {receipt.receiptNumber}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Date: {receipt.paymentDate}</p>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Tenant (Payer)</span>
              <p className="font-bold text-slate-900 text-sm">{receipt.payerName}</p>
              {receipt.payerPhone && <p className="text-slate-500 text-[11px] mt-0.5">{receipt.payerPhone}</p>}
              <p className="text-emerald-700 text-[11px] font-semibold mt-1">✓ Fayda ID Verified</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Landlord (Payee)</span>
              <p className="font-bold text-slate-900 text-sm">{receipt.landlordName}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Carta Verified Owner</p>
              <p className="text-slate-400 text-[10px] mt-1 font-mono">
                Reg: {receipt.contractRegistrationNo || 'PENDING WOREDA RECORD'}
              </p>
            </div>
          </div>

          {/* Property Reference */}
          <div className="mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Leased Property</span>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-bold text-slate-900 text-sm">{receipt.propertyTitle}</p>
            </div>
            <p className="text-xs text-slate-500 ml-6 mt-0.5">{receipt.propertyAddress}</p>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
            <div className="bg-slate-100 px-4 py-2.5 text-[11px] font-bold text-slate-700 grid grid-cols-12 uppercase tracking-wider">
              <span className="col-span-8">Description</span>
              <span className="col-span-4 text-right">Amount (ETB)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs text-slate-800">
              <div className="px-4 py-3 grid grid-cols-12 items-center">
                <div className="col-span-8">
                  <p className="font-bold text-slate-900">Advance First Month Rent</p>
                  <p className="text-[11px] text-slate-500">Credited to landlord verified payout account</p>
                </div>
                <div className="col-span-4 text-right font-mono font-bold">
                  {receipt.monthlyRent.toLocaleString()} ETB
                </div>
              </div>

              <div className="px-4 py-3 grid grid-cols-12 items-center">
                <div className="col-span-8">
                  <p className="font-bold text-slate-900">
                    Security Deposit ({receipt.depositMonths || 2} Months max limit)
                  </p>
                  <p className="text-[11px] text-slate-500">Held in Betoch Escrow pursuant to Proc. No. 1320/2024</p>
                </div>
                <div className="col-span-4 text-right font-mono font-bold">
                  {receipt.depositAmount.toLocaleString()} ETB
                </div>
              </div>

              {receipt.serviceFee ? (
                <div className="px-4 py-3 grid grid-cols-12 items-center bg-slate-50/50">
                  <div className="col-span-8">
                    <p className="font-semibold text-slate-800">Platform Escrow Fee & Legal Stamp</p>
                    <p className="text-[11px] text-slate-500">Includes digital contract generation</p>
                  </div>
                  <div className="col-span-4 text-right font-mono font-semibold">
                    {receipt.serviceFee.toLocaleString()} ETB
                  </div>
                </div>
              ) : null}

              {/* Total Row */}
              <div className="px-4 py-4 grid grid-cols-12 items-center bg-slate-950 text-white">
                <div className="col-span-8">
                  <p className="font-extrabold text-sm uppercase tracking-wide">Total Amount Settled</p>
                  <p className="text-[10px] text-slate-400">Payment Method: {receipt.paymentMethod || 'Telebirr SuperApp'}</p>
                </div>
                <div className="col-span-4 text-right font-mono text-base font-black text-emerald-400">
                  {receipt.totalPaid.toLocaleString()} ETB
                </div>
              </div>
            </div>
          </div>

          {/* Legal Compliance Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-950">
            <span className="font-bold block mb-1">Legal Rent Protection Guarantee:</span>
            In accordance with Federal Democratic Republic of Ethiopia Proclamation No. 1320/2024, the security deposit is strictly capped at a maximum of 2 months' rent. The deposit is retained in escrow until mutual lease conclusion or woreda lease adjudication.
          </div>

          {/* Footer Signatures */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
            <p>Generated electronically by Betoch Real Estate Marketplace. Valid without physical stamp.</p>
            <div className="font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
              TX-VERIFIED-{receipt.receiptNumber.slice(-8)}
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
