/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TrademarkRecord, SyncConflict } from "./types";
import { DEFAULT_SEED_TRADEMARKS } from "./data";
import { AnimatePresence, motion } from "motion/react";
import InteractiveStudio from "./components/InteractiveStudio";
import TrademarkCertificate from "./components/TrademarkCertificate";
import SyncHub from "./components/SyncHub";
import VerifierPortal from "./components/VerifierPortal";
import { 
  PlusCircle, Database, HelpCircle, Award, ShieldCheck, 
  Settings, Wifi, WifiOff, RefreshCw, Layers, Sparkles
} from "lucide-react";

export default function App() {
  // Primary State
  const [records, setRecords] = useState<TrademarkRecord[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TrademarkRecord | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };
  
  // Navigation Tabs state (Default to 'verifier' for public-facing search)
  const [activeTab, setActiveTab] = useState<'studio' | 'certificate' | 'sync' | 'verifier'>('verifier');
  const [prefilledVerifyId, setPrefilledVerifyId] = useState("");
  const [hasServerConnection, setHasServerConnection] = useState(true);

  // Officer access control
  const [isOfficer, setIsOfficer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // On Mount: Check query parameters and parse initial stores
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const verifyId = params.get("verifyId");
      if (verifyId) {
        setPrefilledVerifyId(verifyId);
        setActiveTab("verifier");
      }
    }

    let cached: string | null = null;
    try {
      cached = localStorage.getItem("iraq_trademarks_cache");
    } catch (e) {
      console.warn("localStorage is disabled or blocked in this environment:", e);
    }
    
    let localData: TrademarkRecord[] = [];
    if (cached) {
      try {
        localData = JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached local databases:", e);
      }
    }

    if (!localData || localData.length === 0) {
      localData = DEFAULT_SEED_TRADEMARKS;
    }
    setRecords(localData);

    fetchServerRecords(localData);
  }, []);

  const saveToLocalStorage = (data: TrademarkRecord[]) => {
    try {
      localStorage.setItem("iraq_trademarks_cache", JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save to localStorage (storage might be blocked):", e);
    }
  };

  const fetchServerRecords = async (localList: TrademarkRecord[]) => {
    try {
      const res = await fetch("/api/trademarks");
      if (res.ok) {
        const textStr = await res.text();
        let serverList: TrademarkRecord[] = [];
        try {
          serverList = JSON.parse(textStr) as TrademarkRecord[];
        } catch (jsonErr) {
          console.warn("Server response was not valid JSON:", textStr);
          throw new Error("Invalid response format");
        }
        setHasServerConnection(true);
        const merged = mergeRegistries(localList, serverList);
        setRecords(merged);
        saveToLocalStorage(merged);

        if (merged.length > 0 && !selectedRecord) {
          setSelectedRecord(merged[0]);
        }
      } else {
        setHasServerConnection(false);
      }
    } catch (err) {
      console.warn("Operating with cached local registry data:", err);
      setHasServerConnection(false);
      if (localList.length > 0 && !selectedRecord) {
        setSelectedRecord(localList[0]);
      }
    }
  };

  const mergeRegistries = (local: TrademarkRecord[], server: TrademarkRecord[]): TrademarkRecord[] => {
    const serverMap = new Map<string, TrademarkRecord>(server.map(r => [r.id, r]));
    const mergedMap = new Map<string, TrademarkRecord>(server.map(r => [r.id, { ...r, syncStatus: "synced" as const }]));

    for (const localRec of local) {
      const serverRec = serverMap.get(localRec.id);
      if (!serverRec) {
        if (localRec.syncStatus === "synced") {
          mergedMap.set(localRec.id, { ...localRec, syncStatus: "local-only" });
        } else {
          mergedMap.set(localRec.id, localRec);
        }
      } else {
        if (localRec.updatedAt > serverRec.updatedAt) {
          mergedMap.set(localRec.id, { ...localRec, syncStatus: "local-only" });
        } else if (localRec.updatedAt < serverRec.updatedAt) {
          mergedMap.set(localRec.id, { ...serverRec, syncStatus: "synced" });
        } else {
          mergedMap.set(localRec.id, { ...serverRec, syncStatus: "synced" });
        }
      }
    }
    return Array.from(mergedMap.values());
  };

  const handleTriggerSync = async () => {
    if (isOfflineMode) {
      showToast("Please toggle off the Offline Mode to synchronize records with the server.", "warning");
      return;
    }

    setIsSyncing(true);
    setConflicts([]);
    try {
      const res = await fetch("/api/trademarks/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records })
      });

      if (res.ok) {
        const responseData = await res.json() as { mergedRecords: TrademarkRecord[]; conflictRecords: SyncConflict[] };
        let finalRecords = responseData.mergedRecords;
        const conflictingIds = new Set(responseData.conflictRecords.map(c => c.id));
        finalRecords = finalRecords.map(r => {
          if (conflictingIds.has(r.id)) {
            return { ...r, syncStatus: "conflict" as const };
          }
          return { ...r, syncStatus: "synced" as const };
        });

        setRecords(finalRecords);
        saveToLocalStorage(finalRecords);
        setConflicts(responseData.conflictRecords);
        setHasServerConnection(true);

        if (responseData.conflictRecords.length > 0) {
          setActiveTab("sync");
          showToast(`Sync complete. Detected ${responseData.conflictRecords.length} conflict overlaps requiring manual review.`, "warning");
        } else {
          showToast("Synchronization successful. All registry changes recorded on secure governmental server.", "success");
        }
      } else {
        throw new Error("Server sync responded with error");
      }
    } catch (err: any) {
      console.error("Reconciliation failed:", err);
      setHasServerConnection(false);
      showToast("Database Synchronization failed: Governmental ledger unreachable.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveRecord = async (record: TrademarkRecord) => {
    const updatedRecords = [...records];
    const index = updatedRecords.findIndex((r) => r.id === record.id);
    
    if (index >= 0) {
      updatedRecords[index] = record;
    } else {
      updatedRecords.push(record);
    }
    
    setRecords(updatedRecords);
    saveToLocalStorage(updatedRecords);
    setSelectedRecord(record);

    if (!isOfflineMode) {
      try {
        const res = await fetch("/api/trademarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record)
        });

        if (res.ok) {
          const syncedRecord: TrademarkRecord = {
            ...record,
            syncStatus: "synced" as const
          };
          const freshList = updatedRecords.map(r => r.id === record.id ? syncedRecord : r);
          setRecords(freshList);
          saveToLocalStorage(freshList);
          setSelectedRecord(syncedRecord);
          setHasServerConnection(true);
        } else {
          setHasServerConnection(false);
        }
      } catch (err) {
        console.warn("Failed to push update to server. Storing locally:", err);
        setHasServerConnection(false);
      }
    }
  };

  const handleResolveConflict = async (winner: TrademarkRecord) => {
    const resolvedRecord: TrademarkRecord = {
      ...winner,
      updatedAt: Date.now(),
      syncStatus: "synced" as const
    };

    const updated = records.map(r => r.id === winner.id ? resolvedRecord : r);
    setRecords(updated);
    saveToLocalStorage(updated);
    setSelectedRecord(resolvedRecord);
    setConflicts(prev => prev.filter(c => c.id !== winner.id));

    try {
      await fetch("/api/trademarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resolvedRecord)
      });
    } catch (e) {
      console.warn("Failed to send resolution choice to server:", e);
    }
  };

  const handleImportBackup = (backupList: TrademarkRecord[]) => {
    const existingMap = new Map<string, TrademarkRecord>(records.map(r => [r.id, r]));
    for (const b of backupList) {
      existingMap.set(b.id, {
        ...b,
        updatedAt: b.updatedAt || Date.now(),
        syncStatus: isOfflineMode ? "offline-draft" as const : "local-only" as const
      });
    }

    const combined = Array.from(existingMap.values());
    setRecords(combined);
    saveToLocalStorage(combined);
    if (combined.length > 0) {
      setSelectedRecord(combined[combined.length - 1]);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1234" || pinInput.toLowerCase() === "admin") {
      setIsOfficer(true);
      setShowLoginModal(false);
      setPinInput("");
      setLoginError("");
      setActiveTab("studio");
    } else {
      setLoginError("Invalid clearance PIN.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-indigo-950 font-sans flex flex-col justify-between selection:bg-indigo-100">
      
      {/* Prime Top Navigation Heading Bar - Clean Official Look */}
      <header className="bg-white border-b border-slate-200 shadow-sm text-slate-900 print:hidden transition-colors">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Official Coat of Arms & Government Name */}
          <div className="flex items-center space-x-3.5 text-left select-none">
            <div 
              onClick={() => {
                setShowLoginModal(true);
                showToast("Staff Access Verification Portal Triggered", "info");
              }}
              className="w-12 h-12 rounded-full border border-slate-200 bg-amber-50/50 p-1 flex items-center justify-center shadow-xs cursor-pointer hover:border-amber-300 transition-colors"
              title="Official Seal - Verification Gate"
            >
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-amber-900">
                <path 
                  fill="#8A5A1B" 
                  d="M 50,12 C 48,15 45,20 44,25 C 41,24 37,22 34,20 C 35,26 37,32 39,37 C 33,37 27,35 22,33 C 24,40 28,47 33,52 C 26,54 18,53 10,50 C 13,58 20,65 28,68 C 22,72 15,74 8,75 L 32,80 Q 28,84 15,88 C 24,91 33,90 41,85 C 41,88 40,92 38,95 L 43,95 L 46,90 L 50,92 L 54,90 L 57,95 L 62,95 C 60,92 59,88 59,85 C 67,90 76,91 85,88 C 78,87 72,84 68,80 C 77,82 85,80 92,75 C 85,74 78,72 72,68 C 80,65 87,58 90,50 C 82,53 74,54 67,52 C 72,47 76,40 78,33 C 73,35 67,37 61,37 C 63,32 65,26 66,20 C 63,22 59,24 56,25 C 55,20 52,15 50,12 Z" 
                />
                <rect x="42" y="32" width="16" height="24" rx="1" fill="#FFF" stroke="#653D12" strokeWidth="1" />
                <rect x="42" y="32" width="16" height="8" fill="#D22" />
                <rect x="42" y="48" width="16" height="8" fill="#111" />
                <text x="50" y="44.5" fill="#047857" fontSize="4.2" fontWeight="bold" textAnchor="middle" className="font-sans font-bold select-none">الله أكبر</text>
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9a3412] bg-[#ffedd5] px-1.5 py-0.5 rounded border border-[#fed7aa]">
                  Republic of Iraq
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Ministry of Trade</span>
              </div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 mt-0.5">
                Government Trademark Registry & Intellectual Property Database
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide leading-none" dir="rtl">
                البوابة الفيدرالية للاستعلام عن العلامات التجارية وحمايتها - وزارة التجارة العراقية
              </p>
            </div>
          </div>

          {/* Secure Officer Session Control */}
          <div className="flex items-center gap-3">
            {isOfficer ? (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-150 px-2 py-1 rounded">
                  Officer Active: ID-7798
                </span>
                <button
                  onClick={() => {
                    setIsOfficer(false);
                    setActiveTab("verifier");
                    showToast("Switched to Standard Public Searcher", "info");
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition cursor-pointer"
                  title="Hide registrar tools and view as standard public user"
                >
                  View as Public
                </button>
              </div>
            ) : null}

            <span className={`w-2.5 h-2.5 rounded-full ${hasServerConnection ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"}`} title={hasServerConnection ? "Ministry Ledger Server Online" : "Local Sandbox / Static Database (Auto-Saved)"} />
          </div>

        </div>
      </header>

      {/* Tabs navigation - Restricted depending on officer login */}
      <nav className="w-full max-w-7xl mx-auto px-6 pt-5 print:hidden">
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl p-2 gap-1.5 overflow-x-auto shadow-xs">
          
          <button
            onClick={() => setActiveTab('verifier')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              activeTab === 'verifier' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/60' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'verifier' ? 'text-emerald-700' : 'text-slate-400'}`} />
            <span>National Verification System (الاستعلام والتحقق من العلامات)</span>
          </button>

          <button
            onClick={() => {
              if (records.length === 0) {
                showToast("No trademark records in database.", "warning");
                return;
              }
              setActiveTab('certificate');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              activeTab === 'certificate' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className={`w-4 h-4 ${activeTab === 'certificate' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Official Deed / Certificate (سند التسجيل الرسمي)</span>
          </button>

          {isOfficer && (
            <>
              <button
                onClick={() => setActiveTab('studio')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                  activeTab === 'studio' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className={`w-4 h-4 ${activeTab === 'studio' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Registrar Design Studio (استوديو التسجيل)</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition relative cursor-pointer ${
                  activeTab === 'sync' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Database className={`w-4 h-4 ${activeTab === 'sync' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Ledger Backend Sync (قاعدة المزامنة الفيدرالية)</span>
                {records.some(r => r.syncStatus !== "synced") && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold h-4 w-4">
                    !
                  </span>
                )}
              </button>
            </>
          )}

        </div>
      </nav>

      {/* Main viewport Container */}
      <main className="w-full max-w-7xl mx-auto px-6 flex-grow py-4">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            
            {activeTab === 'verifier' && (
              <VerifierPortal 
                records={records}
                initialSearchId={prefilledVerifyId || (selectedRecord ? selectedRecord.id : "")}
                onSelectRecord={(rec) => {
                  setSelectedRecord(rec);
                }}
                onNavigateToTab={setActiveTab}
                isOfficer={isOfficer}
              />
            )}

            {isOfficer && activeTab === 'studio' && (
              <InteractiveStudio 
                records={records}
                onSaveRecord={handleSaveRecord}
                isOfflineMode={isOfflineMode}
                selectedRecord={selectedRecord}
                onSelectRecord={onSelectRecord => {
                  setSelectedRecord(onSelectRecord);
                }}
                showToast={showToast}
              />
            )}

            {activeTab === 'certificate' && selectedRecord && (
              <TrademarkCertificate 
                record={selectedRecord} 
              />
            )}

            {isOfficer && activeTab === 'sync' && (
              <SyncHub 
                records={records}
                isOfflineMode={isOfflineMode}
                onToggleOffline={() => {
                  setIsOfflineMode(v => !v);
                }}
                onTriggerSync={handleTriggerSync}
                isSyncing={isSyncing}
                conflicts={conflicts}
                onResolveConflict={handleResolveConflict}
                onImportBackup={handleImportBackup}
                showToast={showToast}
              />
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* Elegant Official Footnote */}
      <footer className="w-full text-center border-t border-slate-200 mt-12 py-6 bg-white shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <span className="font-medium text-slate-500">
            © 2026 Republic of Iraq Ministry of Trade &mdash; Directorate of Industrial Property Registration.
          </span>
          <div className="flex space-x-4 items-center">
            <span className="hover:text-amber-800 transition select-none">Law No. 21 of 1957 (Trademarks)</span>
          </div>
        </div>
      </footer>

      {/* Staff Entrance PIN prompt modal - USPTO Elegant All-White Style */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-none border-[6px] border-double border-slate-900 max-w-sm w-full p-6 shadow-2xl space-y-4 text-left relative font-sans">
            {/* Fine border line ornament inside */}
            <div className="absolute inset-1 border border-slate-200 pointer-events-none"></div>
            
            <div className="text-center space-y-2 relative">
              {/* Centered Crest Emblem */}
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 border border-slate-350 p-1 relative">
                <svg viewBox="0 0 100 100" className="w-9 h-9 text-slate-800">
                  <path 
                    fill="currentColor" 
                    d="M 50,12 C 48,15 45,20 44,25 C 41,24 37,22 34,20 C 35,26 37,32 39,37 C 33,37 27,35 22,33 C 24,40 28,47 33,52 C 26,54 18,53 10,50 C 13,58 20,65 28,68 C 22,72 15,74 8,75 L 32,80 Q 28,84 15,88 C 24,91 33,90 41,85 C 41,88 40,92 38,95 L 43,95 L 46,90 L 50,92 L 54,90 L 57,95 L 62,95 C 60,92 59,88 59,85 C 67,90 76,91 85,88 C 78,87 72,84 68,80 C 77,82 85,80 92,75 C 85,74 78,72 72,68 C 80,65 87,58 90,50 C 82,53 74,54 67,52 C 72,47 76,40 78,33 C 73,35 67,37 61,37 C 63,32 65,26 66,20 C 63,22 59,24 56,25 C 55,20 52,15 50,12 Z" 
                  />
                  <rect x="42" y="32" width="16" height="24" rx="1" fill="#FFF" stroke="#111" strokeWidth="0.8" />
                  <rect x="42" y="32" width="16" height="8" fill="#e11d48" />
                  <rect x="42" y="48" width="16" height="8" fill="#111827" />
                  <text x="50" y="44.5" fill="#15803d" fontSize="4.1" fontWeight="bold" textAnchor="middle" className="font-sans font-bold select-none">الله أكبر</text>
                </svg>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block font-sans">REPUBLIC OF IRAQ</span>
                <span className="text-[8.5px] text-slate-405 font-mono block">MINISTRY OF TRADE / REGISTER OFFICE</span>
              </div>
              <h3 className="font-bold text-slate-950 text-sm font-serif uppercase tracking-tight">Staff Security Authentication</h3>
              <p className="text-[10px] text-slate-500 leading-normal font-sans">
                Access restricted to authorized Ministry registrars. Provide secure database credentials.
              </p>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="space-y-4 relative">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">SECURITY CLEARANCE PIN</label>
                <input 
                  type="password"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-none text-center font-mono tracking-widest text-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50 text-slate-900"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-[10px] text-red-700 font-bold text-center bg-red-50 border border-red-200 p-1.5 rounded-none">{loginError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setPinInput("");
                    setLoginError("");
                  }}
                  className="flex-1 py-1.5 border border-slate-300 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-none cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none cursor-pointer text-center shadow-xs"
                >
                  Clearance ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full print:hidden">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl shadow-lg border flex items-start space-x-3 text-sm font-semibold select-none ${
                toast.type === "success" ? "bg-emerald-50 text-emerald-950 border-emerald-200" :
                toast.type === "error" ? "bg-red-50 text-red-950 border-red-200" :
                toast.type === "warning" ? "bg-amber-50 text-amber-950 border-amber-200" :
                "bg-indigo-50 text-indigo-950 border-indigo-200"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && <span className="text-emerald-700 font-bold">✓</span>}
                {toast.type === "error" && <span className="text-red-700 font-bold">⚠</span>}
                {toast.type === "warning" && <span className="text-amber-700 font-bold">⚠</span>}
                {toast.type === "info" && <span className="text-indigo-700 font-bold">ℹ</span>}
              </div>
              <div className="flex-1 leading-normal font-sans text-xs">{toast.message}</div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
                className="text-slate-400 hover:text-slate-600 font-bold text-xs select-none pl-1"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
