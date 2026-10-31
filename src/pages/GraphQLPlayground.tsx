import React, { useState } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Radio,
  Layers,
  Sparkles,
  Users,
  Clock,
  Database,
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface GraphQLPlaygroundProps {
  currentUser: User;
  users: User[];
  isRealtimeConnected: boolean;
  recentEvents: { type: string; data: any; timestamp: string }[];
}

export const GraphQLPlayground: React.FC<GraphQLPlaygroundProps> = ({
  currentUser,
  users,
  isRealtimeConnected,
  recentEvents,
}) => {
  const sampleQueries: Record<string, string> = {
    'All Expenses (Master Ledger)': `query GetAllExpenses {
  expenses(financialYear: "2026-27") {
    _id
    expenseNumber
    purchaseDate
    productName
    category
    quantity
    unit
    unitPrice
    taxableAmount
    totalTax
    totalAmount
    vendorName
    approvalStatus
    paymentStatus
    receivedStatus
  }
}`,

    'Inventory & Consumables Stock': `query GetInventoryStock {
  inventory {
    productId
    productName
    sku
    currentStock
    minimumStock
    reorderLevel
    reorderStatus
    lastPurchasePrice
    lastPurchaseDate
  }
}`,

    'Fixed IT Assets Register': `query GetHardwareAssets {
  assets {
    assetId
    assetName
    brand
    model
    serialNumber
    purchasePrice
    warrantyExpiry
    assignedEmployee
    department
    assetStatus
  }
}`,

    'Executive Dashboard KPIs': `query GetExecutiveStats {
  stats(financialYear: "2026-27") {
    totalExpenses
    totalTax
    currentMonthExpenses
    pendingApprovalsCount
    lowStockCount
    totalAssetsCount
    totalAssetValue
    currencyDistribution {
      currency
      totalAmountInINR
      count
    }
    categoryDistribution {
      category
      amount
      count
    }
  }
}`,

    'Audit History Log': `query GetAuditTrail {
  auditLogs {
    action
    userName
    recordId
    newValue
    timestamp
  }
}`,
  };

  const [query, setQuery] = useState(sampleQueries['All Expenses (Master Ledger)']);
  const [response, setResponse] = useState<string>('// Click "Execute GraphQL Query" to run against the Node.js API\n');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleRun = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const data = await api.graphql(query);
      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(JSON.stringify({ error: err.message }, null, 2));
      setExecutionTime(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" /> GraphQL API &amp; Real-Time Collaboration Console
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-xs font-semibold border border-indigo-500/30">
              Endpoint: /graphql
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Execute flexible typed queries directly against the MongoDB store • Real-time Server-Sent Events (SSE) sync stream
          </p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isRealtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-slate-200 font-semibold font-mono">
            {isRealtimeConnected ? 'Real-Time Sync Stream: Active' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Online Team Members Presence */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold">Team Presence &amp; Active Collaborators:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {users.map((u) => {
            const isMe = u._id === currentUser._id;
            return (
              <div
                key={u._id}
                className={`px-3 py-1 rounded-full flex items-center gap-2 border text-[11px] font-mono ${
                  isMe
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>
                  {u.name} ({u.role.toUpperCase()}) {isMe && '(You)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Query Template Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Sample Queries:</span>
        {Object.entries(sampleQueries).map(([name, qText]) => (
          <button
            key={name}
            onClick={() => setQuery(qText)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              query === qText
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Query & Response Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GraphQL Query Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 font-mono">GraphQL Query Document</span>
            <button
              onClick={handleRun}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{loading ? 'Executing...' : 'Execute Query'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950/40 flex-1">
            <textarea
              rows={16}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 text-indigo-300 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Response JSON Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300 font-mono">JSON Result</span>
              {executionTime !== null && (
                <span className="text-[10px] text-emerald-400 font-mono">({executionTime} ms)</span>
              )}
            </div>

            <button
              onClick={copyToClipboard}
              className="p-1 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950/40 flex-1">
            <pre className="w-full h-80 overflow-y-auto bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-800 leading-relaxed scrollbar-thin">
              {response}
            </pre>
          </div>
        </div>
      </div>

      {/* Live Activity Stream (Recent SSE Events) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="font-semibold text-sm text-slate-200">Real-Time Team Event Stream</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Listening on /api/events</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {recentEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              Awaiting team events. Any new expense, approval, stock issue, or asset assignment will appear here live.
            </p>
          ) : (
            recentEvents.map((evt, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 font-bold">
                    {evt.type}
                  </span>
                  <span className="text-slate-300 truncate max-w-md">
                    {evt.data?.productName || evt.data?.item?.productName || evt.data?.assetName || JSON.stringify(evt.data).slice(0, 60)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
