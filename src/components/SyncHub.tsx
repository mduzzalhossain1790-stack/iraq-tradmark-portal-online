/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TrademarkRecord, SyncConflict } from "../types";
import { 
  Cloud, CloudOff, RefreshCw, Download, Upload, AlertTriangle, 
  CheckCircle, Database, HelpCircle, HardDriveDownload, FileJson
} from "lucide-react";

interface SyncHubProps {
  records: TrademarkRecord[];
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
  conflicts: SyncConflict[];
  onResolveConflict: (resolvedRecord: TrademarkRecord) => void;
  onImportBackup: (backupRecords: TrademarkRecord[]) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function SyncHub({
  records,
  isOfflineMode,
  onToggleOffline,
  onTriggerSync,
  isSyncing,
  conflicts,
  onResolveConflict,
  onImportBackup,
  showToast
}: SyncHubProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Stats calculation
  const totalCount = records.length;
  const syncedCount = records.filter(r => r.syncStatus === "synced").length;
  const modifiedCount = records.filter(r => r.syncStatus === "local-only" || r.syncStatus === "offline-draft").length;
  const activeCount = records.filter(r => r.status === "active").length;
  const expiredCount = records.filter(r => r.status === "expired").length;

  // File export backup
  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(records, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `iraq_trademark_registry_backup_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e: any) {
      console.error("Backup export failed:", e);
    }
  };

  // File import backup
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) {
          setImportError("Invalid backup format. File must contain an array of registered trademarks.");
          return;
        }

        // Validate basic properties
        const isValid = parsed.every((r: any) => r && r.id && typeof r.proprietor === "string");
        if (!isValid) {
          setIntersectionError("Validation incomplete: file does not match Iraq Trademark schema standards.");
          return;
        }

        // Standardize import items as locally modified pending sync
        const importedRecords: TrademarkRecord[] = parsed.map((r: any) => ({
          ...r,
          syncStatus: r.syncStatus || 'local-only',
          updatedAt: r.updatedAt || Date.now()
        }));
        
        onRestore(importedRecords);
      } catch (err: any) {
        setImportError("Error parsing JSON schema: " + err.message);
      }
    };
    fileReader.readAsText(file);
  };

  const [intersectionError, setIntersectionError] = useState<string | null>(null);

  // Custom callback to update parent state with safety
  const onRestore = (imported: TrademarkRecord[]) => {
    onImportBackup(imported);
    showToast(`Registry restored successfully! Loaded ${imported.length} trademark certificate file records.`, "success");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-150 mb-6 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-650" />
            <span>Trademark Storage & Offline Sync Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your decentralized database. This portal provides secure localized file caching and cloud synchronization.
          </p>
        </div>

        {/* Offline Toggle Switch */}
        <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-705">Outage Simulator</span>
            <span className="text-[10px] text-slate-400">Toggle Offline Mode</span>
          </div>
          <button
            onClick={onToggleOffline}
            id="toggle-offline-mode"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              isOfflineMode ? "bg-red-650" : "bg-indigo-600"
            }`}
          >
            <span
              className={`transform inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                isOfflineMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Grid of Database and Protection Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center shadow-xs">
          <span className="text-xl font-extrabold text-indigo-650 block font-mono">{totalCount}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block">Total Records</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center shadow-xs">
          <span className="text-xl font-extrabold text-emerald-600 block font-mono">{syncedCount}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block">Linked & Synced</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center shadow-xs">
          <span className="text-xl font-extrabold text-purple-600 block font-mono">{modifiedCount}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block">Offline Backlog</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center shadow-xs">
          <span className="text-xl font-extrabold text-indigo-905 block font-mono">{activeCount}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block">Active Claims</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center shadow-xs col-span-2 md:col-span-1">
          <span className="text-xl font-extrabold text-red-500 block font-mono">{expiredCount}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block">Expired Claims</span>
        </div>
      </div>

      {/* Sync Operation Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
        
        {/* Core Syncer Action */}
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-start justify-between">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block">Cloud Sync Engine</span>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                Initiate the batch merge sequence to reconcile offline updates with the Iraq Trademark centralized database.
              </p>
            </div>
            
            {/* Status light */}
            {isOfflineMode ? (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-red-50 text-red-650 border border-red-100">
                <CloudOff className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
                <span>OFFLINE</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Cloud className="w-3.5 h-3.5 mr-0.5" />
                <span>ONLINE ACTIVE</span>
              </span>
            )}
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={onTriggerSync}
              disabled={isOfflineMode || isSyncing}
              id="sync-reconcile-action"
              className={`flex items-center justify-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                isOfflineMode 
                  ? "bg-slate-200 text-slate-400 border border-slate-300" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? "Reconciling Assets..." : "Sync Backlog with Server"}</span>
            </button>
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-3 py-2 text-xs bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 transition"
            >
              How it works
            </button>
          </div>
        </div>

        {/* Database Manual Backups */}
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 block">Registry Backup & Portability</span>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Perfect for absolute data safety. Export full registar records as a local JSON file, or restore existing files on a different device offline.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-left">
            <button
              onClick={handleExportBackup}
              id="export-backup-json"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export local JSON</span>
            </button>
            
            <label className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore local JSON</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </label>
          </div>
        </div>

      </div>

      {/* Explainer Segment */}
      {showExplanation && (
        <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-2 leading-relaxed text-left animate-fade-in shadow-xs">
          <h4 className="font-bold text-indigo-950 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1 text-indigo-650" />
            <span>Dual-Replication Sync Mechanics</span>
          </h4>
          <p>
            When executing actions offline, changes are cached in browser <strong>LocalStorage</strong> and marked with unique timestamps (<code>updatedAt</code>) and state flags (<code>offline-draft</code> or <code>local-only</code>).
          </p>
          <p>
            Reconnection executes a batch push sequence to the synchronized server at <code>/api/trademarks/sync</code>. The controller evaluates conflict points using <strong>Last-Write-Wins (LWW)</strong> chronological merges. 
            Any matching-timestamp write discrepancies are flagged for manual operator override below.
          </p>
        </div>
      )}

      {/* Error Output */}
      {(importError || intersectionError) && (
        <div className="mt-4 p-3 bg-red-50 text-red-805 text-xs rounded-xl border border-red-150 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{importError || intersectionError}</span>
        </div>
      )}

      {/* Conflict Resolution Block (Conditional UI) */}
      {conflicts.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center space-x-2 text-red-850 font-bold mb-3">
            <AlertTriangle className="w-5 h-5 text-red-505" />
            <span className="text-sm">Conflicting Edits Detected ({conflicts.length})</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 text-left">
            Chronological timing discrepancies occurred between the server data file and local entries. Choose which registration to persist to keep databases aligned.
          </p>

          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="border border-red-150 rounded-xl overflow-hidden bg-red-50/10">
                <div className="bg-red-50/60 px-4 py-2 border-b border-red-150 text-xs font-bold text-red-950 flex justify-between">
                  <span>Registration ID: #{conflict.id} ({conflict.local.trademarkName})</span>
                  <span>Conflict State</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-xs">
                  {/* Left Choice: Client Local */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-left flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Local Browser Draft Copy</span>
                      <p className="font-semibold text-indigo-905">{conflict.local.proprietor}</p>
                      <p className="text-slate-500 mt-1 leading-normal">{conflict.local.goodsServices.slice(0, 100)}...</p>
                      <span className="text-[10px] text-slate-400 block mt-2">
                        Last Shift: {new Date(conflict.local.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => onResolveConflict(conflict.local)}
                      className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      Keep Local Copy (أبقِ المسودة المحلية)
                    </button>
                  </div>

                  {/* Right Choice: Server Remote */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-left flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Central Registry Master Copy</span>
                      <p className="font-semibold text-emerald-800">{conflict.remote.proprietor}</p>
                      <p className="text-slate-500 mt-1 leading-normal">{conflict.remote.goodsServices.slice(0, 100)}...</p>
                      <span className="text-[10px] text-slate-400 block mt-2">
                        Last Shift: {new Date(conflict.remote.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => onResolveConflict(conflict.remote)}
                      className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      Keep Server Registry (أبقِ نسخة السيرفر)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
