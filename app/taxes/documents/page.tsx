'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FolderOpen,
  Upload,
  File,
  Trash2,
  RefreshCw,
  Download,
  Receipt,
  FileText,
  Shield,
  Clock,
} from 'lucide-react';
import { formatUGX } from '@/lib/tax-utils';

interface TaxEvent {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  source?: string;
  deductible: boolean;
  receiptUrl?: string;
  whtAmount?: number;
  createdAt: string;
}

type DocFilter = 'all' | 'income' | 'expense' | 'wht';

function DocIcon({ type }: { type: string }) {
  if (type === 'income') return <Receipt className="w-4 h-4 text-emerald-500" />;
  if (type === 'expense') return <File className="w-4 h-4 text-orange-500" />;
  return <Shield className="w-4 h-4 text-blue-500" />;
}

export default function DocumentsPage() {
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DocFilter>('all');
  const [uploading, setUploading] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; forId: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const res = await fetch(`/api/taxes/events?year=${year}`);
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Attach receipt reference to a tax event
  const attachReceipt = async (eventId: string, fileName: string) => {
    setUploading(eventId);
    try {
      await fetch(`/api/taxes/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: fileName }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(null);
      setPendingFile(null);
    }
  };

  // Dropzone for drag-and-drop upload UI
  const onDrop = useCallback(
    (acceptedFiles: File[], eventId: string) => {
      const file = acceptedFiles[0];
      if (file) {
        setPendingFile({ file, forId: eventId });
        attachReceipt(eventId, file.name);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const GlobalDropzone = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) =>
        files[0] && alert('Drop on a specific record row to attach a receipt.'),
      multiple: false,
      noClick: true,
    });
    return (
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600">
          {isDragActive ? 'Drop a file here' : 'Document Vault'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Each tax event can have a receipt attached. Attach receipts by clicking the upload icon on
          each row below.
        </p>
      </div>
    );
  };

  const deleteReceipt = async (eventId: string) => {
    if (!confirm('Remove receipt from this record?')) return;
    await fetch(`/api/taxes/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptUrl: null }),
    });
    loadData();
  };

  const filtered =
    filter === 'all' ? events : events.filter((e) => e.type === filter);

  const withReceipts = events.filter((e) => e.receiptUrl).length;
  const whtCount = events.filter((e) => e.type === 'wht').length;

  // Audit trail: all events sorted by date asc
  const auditTrail = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const exportAuditCSV = () => {
    const headers = [
      'Date',
      'Created At',
      'Type',
      'Description',
      'Category',
      'Amount (UGX)',
      'Deductible',
      'Receipt Ref',
    ];
    const rows = auditTrail.map((e) => [
      new Date(e.date).toLocaleDateString(),
      new Date(e.createdAt).toLocaleDateString(),
      e.type.toUpperCase(),
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.amount.toString(),
      e.deductible ? 'Yes' : 'No',
      e.receiptUrl ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            WHT certificates, receipts, invoices &amp; audit trail
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportAuditCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Audit Trail
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: events.length, icon: FileText, color: 'text-gray-700', border: 'border-gray-200' },
          { label: 'With Receipts', value: withReceipts, icon: Receipt, color: 'text-emerald-700', border: 'border-emerald-200' },
          { label: 'WHT Certificates', value: whtCount, icon: Shield, color: 'text-blue-700', border: 'border-blue-200' },
          { label: 'Expenses', value: events.filter((e) => e.type === 'expense').length, icon: FolderOpen, color: 'text-orange-700', border: 'border-orange-200' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white rounded-xl border ${s.border} p-4 shadow-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Drop Zone Info */}
      <GlobalDropzone />

      {/* Filter + Document Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-gray-100 gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">Tax Records & Receipts</h3>
          <div className="flex gap-1">
            {(['all', 'income', 'expense', 'wht'] as DocFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'All' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No documents yet</p>
            <p className="text-xs mt-1">Add income or expenses to see documents here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Receipt / Ref</th>
                  <th className="px-4 py-3 text-center">Attach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((event) => {
                  const RowDropzone = ({ children }: { children: React.ReactNode }) => {
                    const { getRootProps, getInputProps, isDragActive } = useDropzone({
                      onDrop: (files) => onDrop(files, event.id),
                      multiple: false,
                    });
                    return (
                      <td className="px-4 py-3 text-center">
                        <div
                          {...getRootProps()}
                          className={`inline-flex p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isDragActive
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50'
                          }`}
                        >
                          <input {...getInputProps()} />
                          {children}
                        </div>
                      </td>
                    );
                  };

                  return (
                    <tr
                      key={event.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        uploading === event.id ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <DocIcon type={event.type} />
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {event.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-xs truncate">
                          {event.description}
                        </p>
                        <p className="text-xs text-gray-400">{event.category}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span
                          className={
                            event.type === 'income'
                              ? 'text-emerald-600'
                              : event.type === 'expense'
                              ? 'text-orange-600'
                              : 'text-blue-600'
                          }
                        >
                          {formatUGX(event.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {event.receiptUrl ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[140px]">
                              {event.receiptUrl}
                            </span>
                            <button
                              onClick={() => deleteReceipt(event.id)}
                              className="p-0.5 text-gray-300 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No receipt</span>
                        )}
                      </td>
                      <RowDropzone>
                        {uploading === event.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </RowDropzone>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Trail */}
      {auditTrail.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Audit Trail</h3>
              <span className="text-xs text-gray-400">({auditTrail.length} entries)</span>
            </div>
            <button
              onClick={exportAuditCSV}
              className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <div className="divide-y divide-gray-50">
              {auditTrail.map((event, i) => (
                <div key={event.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <DocIcon type={event.type} />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {event.description}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(event.date).toLocaleDateString()} · {event.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        event.type === 'income'
                          ? 'text-emerald-600'
                          : event.type === 'expense'
                          ? 'text-orange-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {formatUGX(event.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
