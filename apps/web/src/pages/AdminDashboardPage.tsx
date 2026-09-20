import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Users,
  ShieldCheck,
  Building,
  FileCheck,
  CreditCard,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'verifications' | 'properties' | 'commissions' | 'reports' | 'audit'>('verifications');

  // Fetch Admin Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.getAdminAnalytics()
  });

  // Fetch Pending Verifications
  const { data: pendingVerifs = [] } = useQuery({
    queryKey: ['admin-pending-verifs'],
    queryFn: () => api.getPendingVerifications()
  });

  // Fetch Pending Properties
  const { data: pendingProps = [] } = useQuery({
    queryKey: ['admin-pending-props'],
    queryFn: () => api.getPendingProperties()
  });

  // Fetch Commissions
  const { data: commissions = [] } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: () => api.getAdminCommissions()
  });

  // Fetch Reports
  const { data: reports = [] } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => api.getAdminReports()
  });

  // Fetch Audit Logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.getAdminAuditLogs()
  });

  // Review Identity Mutation
  const reviewIdMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      api.reviewIdentityVerification(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    }
  });

  // Review Property Mutation
  const reviewPropMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      api.reviewProperty(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-props'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-brand-900 text-white font-black flex items-center justify-center text-xs">
              AD
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">System Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Platform Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit logs, identity verification approvals, title deed checks, and commission oversight.
          </p>
        </div>

        {/* Analytics KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Users</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {analytics?.totalUsers || 0}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {analytics?.verifiedUsers || 0} Fayda Verified
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 block">Active Listings</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {analytics?.activeListings || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across Addis Ababa</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 block">Platform Commission</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {analytics?.totalCommissionEarnedETB?.toLocaleString() || 0} ETB
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">From completed rentals</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 block">Pending Verifications</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {(pendingVerifs.length + pendingProps.length)}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">Require Admin Action</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 mb-6 gap-6 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setTab('verifications')}
            className={`pb-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              tab === 'verifications' ? 'border-brand-700 text-brand-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Identity Verifications ({pendingVerifs.length})
          </button>
          <button
            onClick={() => setTab('properties')}
            className={`pb-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              tab === 'properties' ? 'border-brand-700 text-brand-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Property Verifications ({pendingProps.length})
          </button>
          <button
            onClick={() => setTab('commissions')}
            className={`pb-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              tab === 'commissions' ? 'border-brand-700 text-brand-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Commissions Ledger ({commissions.length})
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`pb-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              tab === 'reports' ? 'border-brand-700 text-brand-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Abuse Reports ({reports.length})
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`pb-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              tab === 'audit' ? 'border-brand-700 text-brand-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Immutable Audit Logs
          </button>
        </div>

        {/* TAB 1: IDENTITY VERIFICATIONS QUEUE */}
        {tab === 'verifications' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            {pendingVerifs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All pending identity verification requests have been cleared.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingVerifs.map((v: any) => (
                  <div key={v.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">{v.userName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {v.role}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {v.maskedId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {v.email} • {v.phone} • Doc Type: <strong>{v.idType}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        Doc URL: {v.documentFrontUrl}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reviewIdMutation.mutate({ id: v.id, decision: 'APPROVED' })}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                      >
                        Approve Fayda ID
                      </button>
                      <button
                        onClick={() => reviewIdMutation.mutate({ id: v.id, decision: 'REJECTED' })}
                        className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROPERTY VERIFICATION QUEUE */}
        {tab === 'properties' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            {pendingProps.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No property listings awaiting title deed verification.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingProps.map((p: any) => (
                  <div key={p.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                      <p className="text-xs text-slate-500">
                        {p.neighborhood}, {p.subCity} • Rent: {p.monthlyRent.toLocaleString()} ETB/mo
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Owner: {p.owner.name} ({p.owner.email})
                      </p>
                      {p.titleDeedUrl && (
                        <p className="text-[11px] text-emerald-800 font-mono mt-1">
                          Proof of Ownership: {p.titleDeedUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reviewPropMutation.mutate({ id: p.id, decision: 'VERIFIED' })}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                      >
                        Grant Verified Badge
                      </button>
                      <button
                        onClick={() => reviewPropMutation.mutate({ id: p.id, decision: 'REJECTED' })}
                        className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMISSIONS LEDGER */}
        {tab === 'commissions' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Property</th>
                  <th className="p-4">Landlord</th>
                  <th className="p-4">Monthly Rent</th>
                  <th className="p-4">Commission (10%)</th>
                  <th className="p-4">Rule</th>
                  <th className="p-4">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {commissions.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{c.propertyTitle}</td>
                    <td className="p-4">{c.owner.name}</td>
                    <td className="p-4">{c.rentalAmount.toLocaleString()} ETB</td>
                    <td className="p-4 font-bold text-emerald-700">{c.commissionAmount.toLocaleString()} ETB</td>
                    <td className="p-4 font-mono text-[11px] text-slate-500">{c.ruleName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: ABUSE REPORTS */}
        {tab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            {reports.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No active abuse or scam reports.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((r: any) => (
                  <div key={r.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {r.reason}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Reported by: {r.reporterName} ({r.reporterEmail})
                      </span>
                    </div>
                    {r.propertyTitle && (
                      <p className="text-xs font-bold text-slate-800">Target Listing: {r.propertyTitle}</p>
                    )}
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{r.description}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: IMMUTABLE AUDIT LOGS */}
        {tab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Immutable System Audit Trail (ASVS Level 2 Compliant)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                  <div>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                      {log.action}
                    </span>
                    <span className="text-slate-600">
                      by <strong>{log.actor}</strong> on <em>{log.resourceType}</em>
                    </span>
                    {log.metadata && (
                      <pre className="text-[10px] text-slate-500 font-mono mt-1 bg-slate-50 p-1 rounded border border-slate-100">
                        {JSON.stringify(log.metadata)}
                      </pre>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
