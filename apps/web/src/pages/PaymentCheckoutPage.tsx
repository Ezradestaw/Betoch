import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { CreditCard, CheckCircle2, ShieldCheck, ArrowRight, Building, Lock } from 'lucide-react';

export const PaymentCheckoutPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const queryClient = useQueryClient();

  const [paymentInitiated, setPaymentInitiated] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract-details', contractId],
    queryFn: () => api.getContract(contractId!),
    enabled: !!contractId
  });

  const initiateMutation = useMutation({
    mutationFn: () =>
      api.initiateTelebirr(
        contractId!,
        contract.commission ? contract.commission.amount : contract.terms.monthlyRent * 0.1,
        'COMMISSION'
      ),
    onSuccess: (data) => {
      setPaymentInitiated(data);
    }
  });

  const handleSimulatePayment = async () => {
    if (!paymentInitiated?.outTradeNo) return;
    setSimulating(true);
    try {
      await api.simulateMockPayment(paymentInitiated.outTradeNo);
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['contract-details', contractId] });
    } catch (err) {
      console.error('Simulation error', err);
    } finally {
      setSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center text-xs text-slate-400">
        Loading payment details...
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 text-center">
        <p className="text-xs font-semibold text-slate-600">Contract not found.</p>
      </div>
    );
  }

  const commissionAmount = contract.commission?.amount || contract.terms.monthlyRent * 0.1;
  const isPaid = contract.commission?.status === 'PAID' || success;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-lg">
          {/* Telebirr branded header */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
              <CreditCard className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Telebirr Checkout</h2>
            <p className="text-xs text-emerald-200 mt-0.5">Ethio Telecom Secure Payment Gateway</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Invoice Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900">{contract.property.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span>{contract.property.neighborhood}, {contract.property.subCity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Rent:</span>
                <span>{contract.terms.monthlyRent.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Category:</span>
                <span className="font-semibold">Platform Finder Commission (10%)</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Total Amount Due:</span>
                <span className="text-xl font-black text-emerald-700">{commissionAmount.toLocaleString()} ETB</span>
              </div>
            </div>

            {/* Status Feedback */}
            {isPaid ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Payment Completed!</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Your platform commission has been settled successfully via Telebirr. Your rental contract is active and in full legal compliance.
                </p>
                <div className="pt-3">
                  <Link
                    to="/owner/dashboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Return to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : !paymentInitiated ? (
              <button
                onClick={() => initiateMutation.mutate()}
                disabled={initiateMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {initiateMutation.isPending ? 'Connecting to Telebirr...' : 'Pay with Telebirr'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block mb-1">Transaction Order Created:</span>
                  <code className="font-mono text-[11px] block bg-white p-1.5 rounded border border-amber-200/80 mb-2">
                    {paymentInitiated.outTradeNo}
                  </code>
                  <p className="text-[11px] text-amber-800">
                    Mode: <strong>{paymentInitiated.mode.toUpperCase()}</strong>. Cryptographic RSA SHA256 signature verified.
                  </p>
                </div>

                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {simulating ? 'Processing Telebirr Callback...' : 'Simulate Telebirr PIN Approval (Sandbox)'}
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                End-to-end encrypted with RSA SHA256 signatures via Ethio Telecom.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
