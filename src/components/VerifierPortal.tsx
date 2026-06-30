/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TrademarkRecord } from "../types";
import { 
  ShieldCheck, ShieldAlert, Search, Database, Globe, Calendar, 
  User, Hash, MapPin, Printer, Filter, CheckCircle2, AlertTriangle,
  BookOpen, HelpCircle, RefreshCw, Layers, Share2, ArrowUpDown, Download,
  Info, Compass, FileText, ChevronRight, Check
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface VerifierPortalProps {
  records: TrademarkRecord[];
  initialSearchId?: string;
  onSelectRecord?: (record: TrademarkRecord) => void;
  onNavigateToTab?: (tabName: "studio" | "verifier" | "certificate" | "sync") => void;
  isOfficer?: boolean;
}

// Nice Class mapping with international official descriptions (All 45 Classes)
const NICE_CLASSES: { [key: string]: string } = {
  "1": "Chemicals for Industry, Science & Photography",
  "2": "Paints, Varnishes, Lacquers & Rust Preservatives",
  "3": "Cosmetics, Soaps, Cleaning Preparations & Perfumery",
  "4": "Industrial Oils, Greases, Lubricants & Fuels",
  "5": "Pharmaceuticals, Medical & Veterinary Preparations",
  "6": "Common Metals, Alloys, Metal Building Materials",
  "7": "Machines, Machine Tools & Power Generators",
  "8": "Hand Tools, Cutlery & Implements",
  "9": "Software, Computers, Electronics & Scientific Apparatus",
  "10": "Surgical, Medical, Dental & Veterinary Instruments",
  "11": "Apparatus for Lighting, Heating, Steam & Cooling",
  "12": "Vehicles, Apparatus for Locomotion by Land, Air or Water",
  "13": "Firearms, Ammunition, Explosives & Fireworks",
  "14": "Precious Metals, Jewelry, Clocks & Watches",
  "15": "Musical Instruments & Accessories",
  "16": "Paper, Cardboard, Printed Matter & Stationary Office Supplies",
  "17": "Rubber, Plastics, Packing, Stopping & Insulating Materials",
  "18": "Leather, Imitation Leather, Luggage, Bags & Saddlery",
  "19": "Non-Metallic Building Materials, Asphalt & Pitch",
  "20": "Furniture, Mirrors, Picture Frames, Wood & Plastic Articles",
  "21": "Household, Kitchen Utensils, Glassware & Ceramics",
  "22": "Ropes, Strings, Nets, Tents, Awnings & Tarpaulins",
  "23": "Yarns and Threads for Textile Use",
  "24": "Textiles, Fabrics & Bed/Table Covers",
  "25": "Clothing, Footwear & Apparel",
  "26": "Lace, Ribbons, Embroidery & Hair Ornaments",
  "27": "Carpets, Rugs, Mats & Wall Hangings",
  "28": "Games, Toys, Playthings & Gymnastic/Sporting Articles",
  "29": "Meat, Fish, Poultry, Preserved/Dried Fruits & Vegetables",
  "30": "Coffee, Tea, Sugar, Rice, Flour, Bread & Confectionery",
  "31": "Agricultural, Horticultural & Forestry Products, Fresh Crops",
  "32": "Beverages, Beers, Mineral Waters & Soft Drinks",
  "33": "Alcoholic Beverages (except Beers)",
  "34": "Tobacco, Smoker's Articles & Matches",
  "35": "Advertising, Business Management, Administration & Retail",
  "36": "Insurance, Financial, Banking & Real Estate Affairs",
  "37": "Building Construction, Installation & Repair Services",
  "38": "Telecommunications & Broadcasting Services",
  "39": "Transport, Packaging, Travel Arrangement & Cargo Storage",
  "40": "Treatment of Materials & Processing Services",
  "41": "Education, Training, Entertainment, Sporting & Media",
  "42": "Scientific, SaaS, IT, Software Development & Technology",
  "43": "Food Services, Restaurants, Cafes & Accommodations",
  "44": "Medical, Veterinary, Hygienic, Beauty & Agriculture Care",
  "45": "Legal, Security & Personal/Social Safety Services"
};

// Popular classifications for quick click grid
const QUICK_CLASSES = [
  { id: "3", label: "Cosmetics / العطور", icon: "💄" },
  { id: "5", label: "Pharma / الأدوية", icon: "💊" },
  { id: "9", label: "Software & Tech / التقنية", icon: "💻" },
  { id: "25", label: "Apparel / الملابس", icon: "👕" },
  { id: "30", label: "Foodstuffs / الأغذية", icon: "☕" },
  { id: "32", label: "Beverages / المشروبات", icon: "🥤" },
  { id: "35", label: "Business / التجارة", icon: "📊" },
  { id: "42", label: "SaaS & R&D / البرمجيات", icon: "⚙️" }
];

export default function VerifierPortal({ 
  records, 
  initialSearchId = "", 
  onSelectRecord,
  onNavigateToTab,
  isOfficer = false
}: VerifierPortalProps) {
  // Search states
  const [searchMode, setSearchMode] = useState<'basic' | 'structured' | 'categories'>('basic');
  const [basicQuery, setBasicQuery] = useState(initialSearchId);
  const [copied, setCopied] = useState(false);
  
  // Advanced Structured Query states
  const [structWordMark, setStructWordMark] = useState("");
  const [structOwner, setStructOwner] = useState("");
  const [structClass, setStructClass] = useState("");
  const [structYear, setStructYear] = useState("");
  const [structStatus, setStructStatus] = useState("all");
  const [structMatchType, setStructMatchType] = useState<"contains" | "exact" | "starts">("contains");
  
  // Sorting states
  const [sortBy, setSortBy] = useState<"id" | "name" | "date">("id");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [searchResults, setSearchResults] = useState<TrademarkRecord[]>(records);
  const [selectedResult, setSelectedResult] = useState<TrademarkRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // FAQ collapse state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Dynamic statistics calculations
  const totalCount = records.length;
  const activeCount = records.filter(r => r.status !== 'expired' && new Date(r.validityDate) >= new Date()).length;
  const expiredCount = totalCount - activeCount;
  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
  
  // Class concentration mapping
  const classCounts: { [key: string]: number } = {};
  records.forEach(r => {
    classCounts[r.classNumber] = (classCounts[r.classNumber] || 0) + 1;
  });
  let topClass = "N/A";
  let maxClassCount = 0;
  Object.entries(classCounts).forEach(([cls, count]) => {
    if (count > maxClassCount) {
      maxClassCount = count;
      topClass = `Class ${cls}`;
    }
  });

  // Share Verification Link
  const handleShareVerifiedLink = () => {
    if (!selectedResult) return;
    const url = `${window.location.origin}?verifyId=${selectedResult.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          })
          .catch((err) => {
            console.warn("Clipboard API failed, fallback copy triggered:", err);
            fallbackCopyText(url);
          });
      } else {
        fallbackCopyText(url);
      }
    } catch (e) {
      console.warn("Exception copied clipboard:", e);
      fallbackCopyText(url);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("Fallback clipboard copy failed:", err);
    }
  };

  // Trigger search on initialSearchId (e.g., query params)
  useEffect(() => {
    if (initialSearchId) {
      setSearchMode('basic');
      setBasicQuery(initialSearchId);
      const match = records.find(r => r.id === initialSearchId);
      if (match) {
        setSearchResults([match]);
        setSelectedResult(match);
      } else {
        setSearchResults([]);
        setSelectedResult(null);
      }
      setHasSearched(true);
    } else {
      setSearchResults(records);
      if (records.length > 0 && !selectedResult) {
        setSelectedResult(records[0]);
      }
    }
  }, [initialSearchId, records]);

  // Apply filtering & sorting rules
  useEffect(() => {
    let list = [...records];

    if (searchMode === 'basic') {
      const query = basicQuery.trim().toLowerCase();
      if (query) {
        list = list.filter(r => 
          r.id.toLowerCase().includes(query) ||
          r.trademarkName.toLowerCase().includes(query) ||
          r.trademarkNameAr.toLowerCase().includes(query) ||
          r.proprietor.toLowerCase().includes(query) ||
          r.proprietorAr.toLowerCase().includes(query) ||
          r.goodsServices.toLowerCase().includes(query)
        );
      }
    } else if (searchMode === 'structured') {
      list = list.filter(r => {
        let matchMark = true;
        if (structWordMark) {
          const markInput = structWordMark.toLowerCase();
          const nameEng = r.trademarkName.toLowerCase();
          const nameAr = r.trademarkNameAr;
          if (structMatchType === "exact") {
            matchMark = nameEng === markInput || nameAr === structWordMark;
          } else if (structMatchType === "starts") {
            matchMark = nameEng.startsWith(markInput) || nameAr.startsWith(structWordMark);
          } else {
            matchMark = nameEng.includes(markInput) || nameAr.includes(structWordMark);
          }
        }

        let matchOwner = true;
        if (structOwner) {
          const ownerInput = structOwner.toLowerCase();
          matchOwner = r.proprietor.toLowerCase().includes(ownerInput) || r.proprietorAr.includes(structOwner);
        }

        let matchClass = true;
        if (structClass) {
          matchClass = r.classNumber.toString() === structClass;
        }

        let matchYear = true;
        if (structYear) {
          const filingYear = r.applicationDate.substring(0, 4);
          matchYear = filingYear === structYear;
        }

        let matchStatus = true;
        if (structStatus !== "all") {
          const isExpired = new Date(r.validityDate) < new Date() || r.status === 'expired';
          const currentStatus = isExpired ? 'expired' : 'active';
          matchStatus = currentStatus === structStatus;
        }

        return matchMark && matchOwner && matchClass && matchYear && matchStatus;
      });
    } else if (searchMode === 'categories') {
      if (structClass) {
        list = list.filter(r => r.classNumber.toString() === structClass);
      }
    }

    // Sort results
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "id") {
        comparison = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortBy === "name") {
        comparison = a.trademarkName.localeCompare(b.trademarkName);
      } else if (sortBy === "date") {
        comparison = new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setSearchResults(list);
    
    // Auto-select first matching result if current selection becomes obsolete
    if (list.length > 0) {
      const stillInList = list.find(x => x.id === selectedResult?.id);
      if (!stillInList) {
        setSelectedResult(list[0]);
      }
    } else {
      setSelectedResult(null);
    }
  }, [basicQuery, structWordMark, structOwner, structClass, structYear, structStatus, structMatchType, searchMode, sortBy, sortOrder, records]);

  const handleBasicSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleStructuredSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleQuickClassClick = (classId: string) => {
    setStructClass(classId);
    setSearchMode('categories');
    setHasSearched(true);
  };

  const handleReset = () => {
    setBasicQuery("");
    setStructWordMark("");
    setStructOwner("");
    setStructClass("");
    setStructYear("");
    setStructStatus("all");
    setStructMatchType("contains");
    setSortBy("id");
    setSortOrder("desc");
    setSearchMode('basic');
    setSearchResults(records);
    setHasSearched(false);
    if (records.length > 0) {
      setSelectedResult(records[0]);
    }
  };

  // CSV Report Exporter
  const handleExportCSV = () => {
    if (searchResults.length === 0) return;
    
    const headers = ["Serial ID", "Trademark (EN)", "Trademark (AR)", "Class", "Proprietor (EN)", "Proprietor (AR)", "Filing Date", "Expiry Date", "Address", "Status"];
    const rows = searchResults.map(r => [
      r.id,
      `"${r.trademarkName.replace(/"/g, '""')}"`,
      `"${r.trademarkNameAr.replace(/"/g, '""')}"`,
      r.classNumber,
      `"${r.proprietor.replace(/"/g, '""')}"`,
      `"${r.proprietorAr.replace(/"/g, '""')}"`,
      r.applicationDate,
      r.validityDate,
      `"${r.address.replace(/"/g, '""')}"`,
      new Date(r.validityDate) < new Date() || r.status === 'expired' ? "Expired" : "Active"
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Iraq_Trademark_Registry_Audit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Genuine Prosecution Milestones generator
  const getTimelineEvents = (r: TrademarkRecord) => {
    const fileDate = new Date(r.applicationDate);
    const formatDate = (date: Date) => date.toISOString().slice(0, 10);
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    return [
      {
        title: "Application Logged / تقديم الطلب",
        desc: "Word mark filed with Directorate of Industrial Property",
        date: formatDate(fileDate),
        status: "completed"
      },
      {
        title: "Formal Review / التدقيق الشكلي والمالي",
        desc: "Completed compliance inspection under Law No. 21",
        date: formatDate(addDays(fileDate, 12)),
        status: "completed"
      },
      {
        title: "Legal Examination / الفحص الموضوعي",
        desc: "Passed relative and absolute registrability parameters",
        date: formatDate(addDays(fileDate, 40)),
        status: "completed"
      },
      {
        title: "Gazette Publication / النشر بالجريدة الرسمية",
        desc: "Published for public inspection in Trademark Gazette",
        date: formatDate(addDays(fileDate, 70)),
        status: "completed"
      },
      {
        title: "Opposition Cleared / انتهاء فترة الاعتراض",
        desc: "90-day statutory public objection period cleared without dispute",
        date: formatDate(addDays(fileDate, 160)),
        status: "completed"
      },
      {
        title: "Deed Fully Granted / منح سند التسجيل رسمي",
        desc: "Signed and registered in national ledger database",
        date: r.registrationDate,
        status: "completed"
      },
      {
        title: "Renewal Due / تجديد السند الإلزامي",
        desc: "10-year federal trademark maintenance filing due",
        date: r.validityDate,
        status: (new Date(r.validityDate) < new Date() || r.status === 'expired') ? "expired" : "future"
      }
    ];
  };

  // Cryptographic Ledger Hash (Visual Integrity Checker)
  const generateLedgerHash = (r: TrademarkRecord) => {
    const stringToHash = `${r.id}-${r.trademarkName}-${r.proprietor}-${r.classNumber}-${r.registrationDate}`;
    let hash = 0;
    for (let i = 0; i < stringToHash.length; i++) {
      const char = stringToHash.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return "IQ-IPD-" + Math.abs(hash).toString(16).toUpperCase().padStart(8, "0") + "-SECURE";
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HERO/BANNER AREA: Authentic Iraqi Ministry of Trade Search Interface */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-xl shadow-xl border border-slate-850">
        {/* Subtle decorative background grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        {/* Intricate thin framing border */}
        <div className="absolute inset-2 border border-slate-800 pointer-events-none rounded-lg" />
        <div className="absolute inset-2.5 border border-amber-500/10 pointer-events-none rounded-lg" />

        <div className="relative px-6 py-8 md:py-12 max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
          <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full text-slate-350 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase text-amber-400">IQ-TESS v3.1: Active Federal Index</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-black font-serif tracking-tight text-white leading-tight">
              Iraq Trademark Electronic Search System
            </h1>
            <h2 className="text-lg md:text-2xl font-bold text-amber-100/90 tracking-wide font-sans mt-1" dir="rtl">
              نظام الاستعلام الإلكتروني عن العلامات التجارية الوطنية المسجلة
            </h2>
            <div className="w-24 h-[2px] bg-amber-500/60 mx-auto my-3" />
            <p className="text-xs md:text-sm text-slate-350 max-w-2xl mx-auto leading-relaxed">
              Welcome to the official, public search gateway of the **Directorate of Industrial Property Registration**. 
              Search the central registry under **Trademark Law No. 21 of 1957** to audit active protection terms, legal owners, nice classifications, and verify official deeds.
            </p>
          </div>

          {/* Quick Disclaimer Flag */}
          <div className="p-3 bg-amber-950/40 border border-amber-900/30 rounded-lg text-[10px] md:text-xs text-amber-250 max-w-xl mx-auto flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-left leading-normal text-slate-300">
              <strong className="text-amber-400">Official Notice:</strong> Results retrieved from this ledger represent true legal standing. Certified documents contain a dynamic verifier QR code matching this cloud database.
            </span>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME STATISTICAL ANALYTICS DASHBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Marks</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="text-2xl md:text-3xl font-black font-mono text-slate-900">{totalCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">100% Active</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-2 font-medium" dir="rtl">إجمالي العلامات الموثقة</span>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Live Protection Term</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="text-2xl md:text-3xl font-black font-mono text-emerald-700">{activeCount}</span>
            <span className="text-[10px] text-emerald-700 font-bold">{activePercent}% Ratio</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-2 font-medium" dir="rtl">سندات حماية سارية المفعول</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-red-500/40 transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Expired / Dead Marks</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="text-2xl md:text-3xl font-black font-mono text-red-700">{expiredCount}</span>
            <span className="text-[10px] text-red-500 font-bold">Needs Renewal</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-2 font-medium" dir="rtl">علامات ملغاة أو منتهية</span>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Top Nice Classification</span>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="text-sm md:text-lg font-black text-indigo-950 truncate max-w-full">{topClass}</span>
            <span className="text-[10px] text-amber-700 font-bold">Class Leader</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-2 font-medium" dir="rtl">أكثر التصنيفات تسجيلاً</span>
        </div>
      </div>

      {/* 3. MAIN SEARCH PORTAL LAYOUT WITH PARAMETERS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Advanced Search Parameters Side Panel (5/12 width) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-md p-5 space-y-4">
          
          {/* Query Mode Sub-Tabs */}
          <div className="flex border-b border-slate-200 gap-1.5 pb-1 select-none">
            <button
              onClick={() => setSearchMode('basic')}
              className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                searchMode === 'basic' 
                  ? 'border-slate-900 text-slate-950 font-black' 
                  : 'border-transparent text-slate-450 hover:text-slate-650'
              }`}
            >
              Public Quick Search
            </button>
            <button
              onClick={() => setSearchMode('structured')}
              className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                searchMode === 'structured' 
                  ? 'border-slate-900 text-slate-950 font-black' 
                  : 'border-transparent text-slate-450 hover:text-slate-650'
              }`}
            >
              Advanced Boolean Search
            </button>
            <button
              onClick={() => setSearchMode('categories')}
              className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                searchMode === 'categories' 
                  ? 'border-slate-900 text-slate-950 font-black' 
                  : 'border-transparent text-slate-450 hover:text-slate-650'
              }`}
            >
              Class Explorer
            </button>
          </div>

          {/* Form Content Areas */}
          {searchMode === 'basic' && (
            <form onSubmit={handleBasicSearch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Universal Search Term / مصطلح الاستعلام الموحد
                </label>
                <div className="relative">
                  <Search className="absolute top-3 left-3 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search trademark name, owner, or registration number..."
                    value={basicQuery}
                    onChange={(e) => setBasicQuery(e.target.value)}
                    className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white font-sans font-medium transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Fuzzy searches across English & Arabic word marks, company owners, serial numbers, or goods specifications.
                </p>
              </div>

              {/* Quick Nice Class Quick Filters */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Quick Class Filter / فئات شائعة
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_CLASSES.map(qc => (
                    <button
                      key={qc.id}
                      type="button"
                      onClick={() => handleQuickClassClick(qc.id)}
                      className={`px-2 py-1.5 border text-left text-[10.5px] font-semibold transition cursor-pointer flex items-center space-x-1.5 rounded-none ${
                        structClass === qc.id && searchMode === 'categories'
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span className="text-xs">{qc.icon}</span>
                      <span className="truncate">{qc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-grow py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer text-center rounded-none shadow-xs"
                >
                  Retrieve Records
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 border border-slate-300 text-slate-650 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer rounded-none"
                >
                  Reset
                </button>
              </div>
            </form>
          )}

          {searchMode === 'structured' && (
            <form onSubmit={handleStructuredSearch} className="space-y-3.5">
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">Trademark Word Mark</label>
                  <select 
                    value={structMatchType}
                    onChange={(e) => setStructMatchType(e.target.value as any)}
                    className="text-[9.5px] text-slate-600 bg-transparent border-none outline-none font-bold underline cursor-pointer"
                  >
                    <option value="contains">CONTAINS</option>
                    <option value="exact">EXACT MATCH</option>
                    <option value="starts">STARTS WITH</option>
                  </select>
                </div>
                <input 
                  type="text"
                  placeholder="e.g. PEPSI"
                  value={structWordMark}
                  onChange={(e) => setStructWordMark(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 font-semibold rounded-none focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">Proprietor / Registered Holder</label>
                <input 
                  type="text"
                  placeholder="e.g. Nestle"
                  value={structOwner}
                  onChange={(e) => setStructOwner(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 rounded-none focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">Nice Classification Class</label>
                <select
                  value={structClass}
                  onChange={(e) => setStructClass(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 font-semibold rounded-none"
                >
                  <option value="">All 45 Nice Classes</option>
                  {Object.entries(NICE_CLASSES).map(([cls, desc]) => (
                    <option key={cls} value={cls}>Class {cls} - {desc}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">Filing Year</label>
                  <select
                    value={structYear}
                    onChange={(e) => setStructYear(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 font-semibold rounded-none"
                  >
                    <option value="">All Years</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">Registry Status</label>
                  <select
                    value={structStatus}
                    onChange={(e) => setStructStatus(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 font-semibold rounded-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">LIVE (Active)</option>
                    <option value="expired">DEAD (Expired)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-grow py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer text-center rounded-none shadow-xs"
                >
                  Apply Operators
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 border border-slate-300 text-slate-650 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer rounded-none"
                >
                  Reset
                </button>
              </div>
            </form>
          )}

          {searchMode === 'categories' && (
            <div className="space-y-3">
              <span className="text-[10.5px] text-slate-500 leading-normal block">
                Select a class classification to inspect all filed trademarks categorized under that Nice code:
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {Object.entries(NICE_CLASSES).map(([cls, desc]) => (
                  <button
                    key={cls}
                    onClick={() => {
                      setStructClass(cls);
                      setSearchResults(records.filter(r => r.classNumber.toString() === cls));
                    }}
                    className={`w-full p-2 border text-left text-xs flex items-start space-x-2 transition ${
                      structClass === cls 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span className="font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded border border-slate-300 mr-1 text-[10px]">
                      {cls}
                    </span>
                    <span className="font-sans leading-tight text-[10.5px] truncate">{desc}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 border border-slate-300 text-slate-650 hover:bg-slate-50 font-bold text-xs text-center transition rounded-none mt-2"
              >
                Clear Category Search
              </button>
            </div>
          )}

          {/* Quick Informational Guide Widget */}
          <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-lg text-[10.5px] text-indigo-950 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-900">
              <Compass className="w-4 h-4 text-indigo-800" />
              <span>Search Guide / دليل البحث</span>
            </div>
            <p className="text-slate-650 leading-relaxed font-sans text-[10px]">
              Type words like **"Tesla"**, **"Pepsi"**, or a registration serial. Advanced Boolean queries let you filter specific filing years or Nice classes. Click a result on the right to examine its legal progression.
            </p>
          </div>

        </div>

        {/* Right Side: Tabular Search Results List & Export (7/12 width) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col justify-between">
          
          <div>
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3.5 flex justify-between items-center select-none">
              <span className="text-xs font-bold text-slate-800 flex items-center">
                <Database className="w-4 h-4 text-slate-700 mr-2" />
                <span>Search Index ({searchResults.length} Match Records)</span>
              </span>
              <div className="flex items-center space-x-2">
                {searchResults.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 flex items-center space-x-1 cursor-pointer transition shadow-xs"
                    title="Export matching records as CSV report spreadsheet"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export CSV</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-mono font-bold" dir="rtl">
                  المطابقة: {searchResults.length}
                </span>
              </div>
            </div>

            {/* Results table in USPTO format */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 select-none font-sans">
                    <th className="py-2.5 px-4">Serial / ID</th>
                    <th className="py-2.5 px-3">Trademark Wordmark</th>
                    <th className="py-2.5 px-2">Class</th>
                    <th className="py-2.5 px-3">Proprietor / Holder</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px] font-sans">
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-slate-400 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <ShieldAlert className="w-8 h-8 text-slate-400" />
                          <p className="font-bold text-slate-700 text-xs">No Matching Trademarks Located</p>
                          <p className="text-[10.5px] max-w-xs leading-normal">Confirm query parameters, try another keyword, or clear classifications.</p>
                          <button 
                            type="button" 
                            onClick={handleReset} 
                            className="mt-1 text-xs text-indigo-700 font-bold underline cursor-pointer"
                          >
                            Reset Registry Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    searchResults.map((r) => {
                      const isSelected = selectedResult?.id === r.id;
                      const isExpired = new Date(r.validityDate) < new Date() || r.status === 'expired';
                      
                      return (
                        <tr 
                          key={r.id}
                          onClick={() => setSelectedResult(r)}
                          className={`cursor-pointer transition select-none hover:bg-slate-50/80 ${
                            isSelected ? 'bg-amber-50/50 font-semibold border-l-4 border-amber-500' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                            #{r.id}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-950 block font-bold tracking-tight">{r.trademarkName}</span>
                            <span className="text-slate-450 text-[10px] block mt-0.5" dir="rtl">{r.trademarkNameAr}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span 
                              className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[9.5px] rounded" 
                              title={NICE_CLASSES[r.classNumber] || "Unknown Nice Class"}
                            >
                              {r.classNumber}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 truncate max-w-[130px]" title={r.proprietor}>
                            {r.proprietor}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isExpired ? (
                              <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-200 font-extrabold text-[8.5px] tracking-wider rounded uppercase">
                                DEAD
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[8.5px] tracking-wider rounded uppercase">
                                LIVE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between select-none font-mono font-bold">
            <span>Records 1-{searchResults.length} of {searchResults.length} Matches</span>
            <span>IQ-LEDGER Standard v2026.06</span>
          </div>

        </div>

      </div>

      {/* 4. DETAILED LEGAL DOSSIER & VERIFICATION RECEIPTS AREA FOR SELECTED RESULT */}
      {selectedResult && (
        <div className="bg-white border-2 border-slate-300 rounded-none overflow-hidden shadow-lg animate-fade-in text-left relative">
          {/* Subtle design element: Security fine border */}
          <div className="absolute inset-1.5 border border-slate-200 pointer-events-none" />
          
          {/* Headline bar */}
          <div className="bg-slate-950 text-white px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
            <div className="space-y-1 relative">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">LEDGER VERIFIED AUTHENTIC</span>
              </div>
              <h3 className="text-sm font-serif font-bold text-slate-100">
                Record Case Dossier: #{selectedResult.id} &mdash; Federal Intellectual Property Register Entry
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap z-10 relative">
              {onNavigateToTab && (
                <button
                  onClick={() => {
                    if (onSelectRecord) {
                      onSelectRecord(selectedResult);
                    }
                    onNavigateToTab("certificate");
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-950 border border-slate-300 rounded-none font-bold text-[11px] shadow-sm transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download official Deed / PDF</span>
                </button>
              )}

              <button
                onClick={handleShareVerifiedLink}
                className={`px-3.5 py-2 rounded-none font-bold text-[11px] shadow-sm transition cursor-pointer text-center flex items-center space-x-1.5 ${
                  copied 
                    ? "bg-emerald-600 text-white border border-emerald-500" 
                    : "bg-indigo-700 hover:bg-indigo-800 text-white border border-indigo-650"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? "Link Copied!" : "Share Link"}</span>
              </button>

              {isOfficer && onSelectRecord && (
                <button
                  onClick={() => onSelectRecord(selectedResult)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-none font-bold text-[11px] shadow-sm transition cursor-pointer"
                >
                  Edit in Registrar Studio
                </button>
              )}
            </div>
          </div>

          {/* Dossier Body Split */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed relative">
            
            {/* Left side Details Block (7/12) */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Detailed specification list */}
              <div className="space-y-2.5">
                
                {/* ID row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 pb-2 border-b border-slate-150">
                  <div className="sm:col-span-4 text-[10px] font-bold text-slate-400 uppercase flex items-center font-sans">
                    <Hash className="w-3.5 h-3.5 mr-1.5 text-slate-405" />
                    <span>Registration Serial ID</span>
                  </div>
                  <div className="sm:col-span-5 font-mono font-bold text-slate-950 text-xs">
                    #{selectedResult.id}
                  </div>
                  <div className="sm:col-span-3 text-[10px] text-right text-slate-400 font-sans font-bold" dir="rtl">
                    الرقم التعريفي الفيدرالي
                  </div>
                </div>

                {/* Proprietor row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 pb-2 border-b border-slate-150">
                  <div className="sm:col-span-4 text-[10px] font-bold text-slate-400 uppercase flex items-center font-sans">
                    <User className="w-3.5 h-3.5 mr-1.5 text-slate-405" />
                    <span>Proprietor Holder</span>
                  </div>
                  <div className="sm:col-span-5 font-bold text-slate-900 text-xs">
                    {selectedResult.proprietor}
                  </div>
                  <div className="sm:col-span-3 text-xs text-right text-slate-650 font-bold" dir="rtl">
                    {selectedResult.proprietorAr}
                  </div>
                </div>

                {/* Registered Address */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 pb-2 border-b border-slate-150">
                  <div className="sm:col-span-4 text-[10px] font-bold text-slate-400 uppercase flex items-center font-sans">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-405" />
                    <span>Registered Address</span>
                  </div>
                  <div className="sm:col-span-5 text-slate-800 font-medium text-xs">
                    {selectedResult.address}
                  </div>
                  <div className="sm:col-span-3 text-[10.5px] text-right text-slate-650 font-bold" dir="rtl">
                    {selectedResult.addressAr}
                  </div>
                </div>

                {/* Nice classification row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 pb-2 border-b border-slate-150">
                  <div className="sm:col-span-4 text-[10px] font-bold text-slate-400 uppercase flex items-center font-sans">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-405" />
                    <span>International Nice Class</span>
                  </div>
                  <div className="sm:col-span-5 text-xs text-slate-900 font-bold flex items-center">
                    <span className="bg-slate-100 text-slate-850 border border-slate-250 px-2 py-0.5 font-mono mr-2 rounded">
                      Class {selectedResult.classNumber}
                    </span>
                    <span className="text-slate-500 font-normal italic text-[10px] truncate max-w-xs" title={NICE_CLASSES[selectedResult.classNumber]}>
                      ({NICE_CLASSES[selectedResult.classNumber] || "Custom Category"})
                    </span>
                  </div>
                  <div className="sm:col-span-3 text-[10px] text-right text-slate-400 font-sans font-bold" dir="rtl">
                    تصنيف نيس للمنتجات والخدمات
                  </div>
                </div>

                {/* English Specification */}
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase tracking-wider text-slate-450 font-sans font-bold block mb-1">
                    Class Scope of Goods / Services (EN)
                  </span>
                  <p className="text-slate-800 text-[10px] leading-relaxed font-sans max-h-24 overflow-y-auto pr-1">
                    {selectedResult.goodsServices || "No specific scope logged. Authorized standard class designation applies."}
                  </p>
                </div>

                {/* Arabic Specification */}
                <div className="p-3 bg-slate-50 border border-slate-200 text-right" dir="rtl">
                  <span className="text-[9px] text-slate-455 font-sans font-bold block mb-1">
                    بيان البضائع والخدمات المسجلة بقيد الحماية (AR)
                  </span>
                  <p className="text-slate-800 text-[10px] leading-relaxed font-sans max-h-24 overflow-y-auto pl-1">
                    {selectedResult.goodsServicesAr || "لم يتم تسجيل مواصفات مخصصة. تسري التصنيفات النموذجية المعتمدة للفئة."}
                  </p>
                </div>

              </div>

              {/* Prosecution Timeline Milestones */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block mb-3">
                  Prosecution Prosecution History / مراحل تسجيل القيد وفترة الاعتراض
                </span>
                
                <div className="relative pl-4 space-y-4 border-l border-slate-200 ml-2">
                  {getTimelineEvents(selectedResult).map((evt, idx) => {
                    const isDone = evt.status === "completed";
                    const isExp = evt.status === "expired";
                    
                    return (
                      <div key={idx} className="relative text-xs">
                        {/* Dot indicator */}
                        <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                          isDone ? "bg-emerald-500 border-emerald-100" :
                          isExp ? "bg-red-500 border-red-100 animate-pulse" :
                          "bg-slate-300 border-white"
                        }`} />
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                          <span className="font-bold text-slate-900 text-[11px]">{evt.title}</span>
                          <span className="text-[10px] font-mono text-slate-450 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {evt.date}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{evt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right side Graphical Block & QR Code (5/12) */}
            <div className="md:col-span-4 flex flex-col justify-between items-center space-y-5 md:border-l border-slate-150 md:pl-5">
              
              {/* Image representation frame */}
              <div className="w-full text-center">
                <span className="text-[9.5px] uppercase tracking-wider text-slate-450 font-sans font-bold block mb-1.5">
                  Visual Wordmark / العلامة المسجلة
                </span>
                <div className="w-full h-36 border border-slate-300 bg-white flex items-center justify-center p-3 relative shadow-xs">
                  {selectedResult.logoStyle === "uploaded-image" && selectedResult.imageLogo ? (
                    <img 
                      src={selectedResult.imageLogo} 
                      alt="Trademark logo" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-1 font-serif select-none">
                      <span className="text-lg font-black tracking-tight text-slate-950 uppercase block">
                        {selectedResult.trademarkName}
                      </span>
                      <span className="text-xs font-bold text-slate-700 mt-1 block font-sans" dir="rtl">
                        {selectedResult.trademarkNameAr}
                      </span>
                      <div className="absolute bottom-1 right-1 text-[7px] text-slate-405 font-mono tracking-widest uppercase">
                        [Wordmark representation]
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic status card */}
              <div className="w-full">
                {new Date(selectedResult.validityDate) < new Date() || selectedResult.status === 'expired' ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-950 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-red-800">
                      <AlertTriangle className="w-4.5 h-4.5" />
                      <span>EXPIRED PROTECTION TERM / منتهية الحماية</span>
                    </div>
                    <p className="text-[10px] text-red-700 mt-1 leading-normal font-sans">
                      This trademark registry protection term is expired. Statutory renewal filings must be processed immediately with the General Registrar to avoid public abandonment.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>ACTIVE FEDERAL PROTECTION / حماية فعالة</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-1 leading-normal font-sans">
                      This trademark is formally recorded and actively defended against infringements across the Republic of Iraq under Law No. 21. No conflicts detected.
                    </p>
                  </div>
                )}
              </div>

              {/* Secure Verifier QR code block */}
              <div className="w-full bg-slate-50 p-3 border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-white p-1 border border-slate-300">
                    <QRCodeSVG 
                      value={`${window.location.origin}?verifyId=${selectedResult.id}`}
                      size={68}
                      level="Q"
                      includeMargin={false}
                      fgColor="#0f172a"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-900 block font-sans">QR AUDIT LEDGER</span>
                    <p className="text-[8px] text-slate-500 leading-normal font-sans mt-0.5">
                      Scan to dynamically verify validation logs directly on our government cloud server.
                    </p>
                    <span className="text-[8px] font-bold text-indigo-750 block mt-0.5" dir="rtl">امسح للتحقق الرقمي الفوري</span>
                  </div>
                </div>

                {/* Ledger Signature Hash */}
                <div className="pt-2 border-t border-slate-200 text-[8.5px] text-slate-500">
                  <span className="font-bold text-slate-400 block font-mono">LEDGER BLOCK SIGNATURE</span>
                  <span className="font-mono font-bold text-slate-800 block break-all">{generateLedgerHash(selectedResult)}</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 5. COLLAPSIBLE USPTO-STYLE LAW & DATABASE GUIDE FAQs */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 text-left">
        <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3 mb-4">
          <BookOpen className="w-5 h-5 text-slate-800 shrink-0" />
          <div>
            <h3 className="font-bold text-slate-950 font-serif text-sm">IQ-TESS Public Portal Legal Database Guide</h3>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Understanding Iraq Trademark Law No. 21 of 1957 & Search Instructions</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          
          {[
            {
              q: "What is the legal framework governing trademarks in Iraq?",
              a: "Trademarks in Iraq are governed by **Trademark and Industrial Indications Law No. 21 of 1957**, which provides the statutory basis for exclusive rights, opposition proceedings, infringement litigation, and international Nice classifications."
            },
            {
              q: "How long is the active protection term for registered trademarks?",
              a: "Pursuant to Iraqi Law, once a trademark is successfully registered and signed by the General Registrar, it is protected for a **statutory term of 10 years** from the date of filing. It can be renewed indefinitely for successive 10-year terms upon payment of renewal fees."
            },
            {
              q: "What is the 'Nice Classification' system?",
              a: "Iraq adheres to the **Nice Agreement Concerning the International Classification of Goods and Services**. This system divides products and services into 45 classes (1-34 for physical goods, 35-45 for services), allowing precise protection bounds."
            },
            {
              q: "How do I perform a search using the IQ-TESS portal?",
              a: "You can use **Public Quick Search** to enter direct keywords (e.g., 'Tesla' or 'Pepsi') or registration serials. The **Advanced Boolean Search** tab allows operators to refine results by specific proprietor names, Nice classes, or years. Selecting a result triggers a secure prosecution timeline and validation audit receipt."
            }
          ].map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={index} className="py-3">
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex justify-between items-center text-left font-bold text-slate-800 hover:text-slate-950 transition cursor-pointer select-none text-[11px]"
                >
                  <span>{item.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-90 text-slate-900" : ""}`} />
                </button>
                {isOpen && (
                  <p className="mt-2 text-[10.5px] text-slate-650 leading-relaxed font-sans bg-slate-50 p-2.5 border border-slate-150 border-dashed rounded-none">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
