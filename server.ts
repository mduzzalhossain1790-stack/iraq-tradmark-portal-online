/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { TrademarkRecord } from "./src/types";

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini GenAI client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini GenAI Client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Translation will run in high-quality local algorithmic simulation mode.");
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Paths
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "trademarks.json");

// Default initial data for seeding - expanded to 12 realistic historical records starting from 2022
const SEED_TRADEMARKS: TrademarkRecord[] = [
  {
    id: "355079",
    proprietor: "MD UZZAL GROUP LTD",
    proprietorAr: "مجموعة إم دي أوزال المحدودة",
    trademarkName: "MURASIL AL-GHARBIYA 1",
    trademarkNameAr: "مراسل الغربية ١",
    classNumber: 41,
    goodsServices: "News reporters services; news broadcasting; digital publishing; media photography and reporting services in the Western districts.",
    goodsServicesAr: "خدمات مراسلي الأخبار؛ بث الأخبار؛ النشر الرقمي؛ التصوير الإعلامي وخدمات إعداد التقارير في المناطق الغربية.",
    applicationDate: "2022-04-12",
    registrationDate: "2022-10-12",
    validityDate: "2032-10-12",
    address: "District 903, Al-Karrada, Baghdad, Iraq",
    addressAr: "حي ٩٠٣، الكرادة، بغداد، العراق",
    logoStyle: "stylized-text",
    updatedAt: 1665532800000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "354120",
    proprietor: "AL-MANSOUR REFRESHMENTS LTD",
    proprietorAr: "شركة المنصور للمرطبات المحدودة",
    trademarkName: "TIGRIS BLUE WATER",
    trademarkNameAr: "مياه دجلة الزرقاء",
    classNumber: 32,
    goodsServices: "Mineral and aerated waters and other non-alcoholic beverages; fruit beverages and fruit juices; syrups and other preparations for making beverages.",
    goodsServicesAr: "المياه المعدنية والغازية وغيرها من المشروبات غير الكحولية؛ مشروبات الفواكه وعصائر الفواكه؛ الشراب وغيره من المستحضرات لصنع المشروبات.",
    applicationDate: "2021-09-05",
    registrationDate: "2022-03-15",
    validityDate: "2032-03-15",
    address: "Industrial Ward, Al-Mansour, Baghdad, Iraq",
    addressAr: "الحي الصناعي، المنصور، بغداد، العراق",
    logoStyle: "stylized-text",
    updatedAt: 1647302400000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "356002",
    proprietor: "BABYLON TECHNOLOGY SYSTEMS",
    proprietorAr: "بابل لأنظمة التكنولوجيا",
    trademarkName: "UR SOFTWARE SUITE",
    trademarkNameAr: "باقة برمجيات أور",
    classNumber: 9,
    goodsServices: "Computer software systems; mobile applications; databases for registration; secure cryptographic authorization terminals.",
    goodsServicesAr: "أنظمة برامج الكمبيوتر؛ تطبيقات الهاتف المحمول؛ قواعد بيانات التسجيل؛ محطات المصادقة التشفيرية الآمنة.",
    applicationDate: "2023-01-10",
    registrationDate: "2023-05-20",
    validityDate: "2033-05-20",
    address: "Babylon Square, Hilla, Babylon Governorate, Iraq",
    addressAr: "ساحة بابل، الحلة، محافظة بابل، العراق",
    logoStyle: "stylized-text",
    updatedAt: 1684540800000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "410294",
    proprietor: "TESLA, INC.",
    proprietorAr: "شركة تيسلا المحدودة",
    trademarkName: "TESLA",
    trademarkNameAr: "تيسلا",
    classNumber: 12,
    goodsServices: "Electric land vehicles, namely, electric cars, power units, chassis; batteries, superchargers and engines for electric vehicles; structural parts thereof.",
    goodsServicesAr: "مركبات برية كهربائية، وهي السيارات الكهربائية، ووحدات الطاقة، وهياكل السيارات؛ البطاريات والشواحن الفائقة ومحركات المركبات الكهربائية؛ وأجزائها الهيكلية.",
    applicationDate: "2023-03-14",
    registrationDate: "2023-09-14",
    validityDate: "2033-09-14",
    address: "3500 Deer Creek Road, Palo Alto, California, USA",
    addressAr: "٣٥٠٠ طريق دير كريك، بالو ألتو، كاليفورنيا، الولايات المتحدة الأمريكية",
    logoStyle: "stylized-text",
    updatedAt: 1694649600000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "421045",
    proprietor: "APPLE INC.",
    proprietorAr: "شركة أبل المساهمة",
    trademarkName: "APPLE",
    trademarkNameAr: "أبل",
    classNumber: 9,
    goodsServices: "Smart phones, computer hardware, digital music players, personal digital assistants, network software, operating systems, tablet computers.",
    goodsServicesAr: "الهواتف الذكية، أجهزة الكمبيوتر، مشغلات الموسيقى الرقمية، المساعدات الرقمية الشخصية، برمجيات الشبكات، أنظمة التشغيل، أجهزة الكمبيوتر اللوحية.",
    applicationDate: "2023-07-06",
    registrationDate: "2024-01-10",
    validityDate: "2034-01-10",
    address: "One Apple Park Way, Cupertino, California, USA",
    addressAr: "وان أبل بارك واي، كوبرتينو، كاليفورنيا، الولايات المتحدة الأمريكية",
    logoStyle: "stylized-text",
    updatedAt: 1704844800000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "430891",
    proprietor: "PEPSICO, INC.",
    proprietorAr: "شركة بيبسيكو المحدودة",
    trademarkName: "PEPSI-COLA",
    trademarkNameAr: "بيبسي كولا",
    classNumber: 32,
    goodsServices: "Carbonated non-alcoholic soft drinks; syrups, concentrates, powders, and preparations for making mineral and aerated waters and beverages.",
    goodsServicesAr: "مشروبات غازية غير كحولية؛ شراب، مركزات، مساحيق، ومستحضرات لصنع المياه المعدنية والغازية والمشروبات.",
    applicationDate: "2022-05-02",
    registrationDate: "2022-11-05",
    validityDate: "2032-11-05",
    address: "700 Anderson Hill Road, Purchase, New York, USA",
    addressAr: "٧٠٠ طريق أندرسون هيل، بيرتشايس، نيويورك، الولايات المتحدة الأمريكية",
    logoStyle: "stylized-text",
    updatedAt: 1667606400000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "438201",
    proprietor: "AL-RAFIDAIN PAINTS AND CHEMICAL CO",
    proprietorAr: "شركة الرافدين للأصباغ والمواد الكيماوية",
    trademarkName: "RAFIDAIN PAINTS",
    trademarkNameAr: "أصباغ الرافدين",
    classNumber: 2,
    goodsServices: "Paints, varnishes, lacquers; preservatives against rust and against deterioration of wood; colorants, mordants; raw natural resins.",
    goodsServicesAr: "الدهانات، الورنيش، واللاكيه؛ واقيات الصدأ ومنع تلف الأخشاب؛ المواد الملونة، المواد المثبتة للألوان؛ الراتنجات الطبيعية الخام.",
    applicationDate: "2023-06-18",
    registrationDate: "2023-12-18",
    validityDate: "2033-12-18",
    address: "Industrial Area East, Erbil, Iraq",
    addressAr: "المنطقة الصناعية الشرقية، أربيل، العراق",
    logoStyle: "stylized-text",
    updatedAt: 1702857600000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "440192",
    proprietor: "AL-MAHA SEED & AGRICULTURE INT",
    proprietorAr: "شركة المها للحبوب والزراعة العالمية",
    trademarkName: "MAHA GREEN",
    trademarkNameAr: "المها الأخضر",
    classNumber: 31,
    goodsServices: "Agricultural seeds, forestry grains, fresh fruits and organic vegetables; plant seeds, natural flowers and crop seedlings.",
    goodsServicesAr: "البذور الزراعية، حبوب الغابات، الفواكه الطازجة والخضروات العضوية؛ بذور النباتات، الزهور الطبيعية وشتلات المحاصيل.",
    applicationDate: "2023-12-25",
    registrationDate: "2024-06-25",
    validityDate: "2034-06-25",
    address: "Al-Mansour Quarter, Baghdad, Iraq",
    addressAr: "حي المنصور، بغداد، العراق",
    logoStyle: "stylized-text",
    updatedAt: 1719273600000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "448920",
    proprietor: "SINOPEC CHONGQING COIL CO.",
    proprietorAr: "شركة سينوبك تشونغتشينغ للمحامل",
    trademarkName: "SINOPEC LUBRI",
    trademarkNameAr: "سينوبك لوبري",
    classNumber: 4,
    goodsServices: "Industrial lubricants, motor oils, grease, paraffin wax, petroleum petroleum fuels and high-temperature machinery fluids.",
    goodsServicesAr: "زيوت التشحيم الصناعية، زيوت المحركات، الشحوم، شمع البارافين، وقود البترول وسوائل الآلات ذات الحرارة العالية.",
    applicationDate: "2024-08-14",
    registrationDate: "2025-02-14",
    validityDate: "2035-02-14",
    address: "Chongqing High Tech District, Chongqing, China",
    addressAr: "منطقة تشونغتشينغ للتقنيات العالية، تشونغتشينغ، الصين",
    logoStyle: "stylized-text",
    updatedAt: 1739491200000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "452097",
    proprietor: "MICROSOFT CORPORATION",
    proprietorAr: "شركة مايكروسوفت العالمية",
    trademarkName: "WINDOWS IRAQ",
    trademarkNameAr: "ويندوز العراق",
    classNumber: 42,
    goodsServices: "Cloud computing services, design of computer software, technical translation services for operating systems, networks support.",
    goodsServicesAr: "خدمات الحوسبة السحابية، تصميم برمجيات الكمبيوتر، خدمات الترجمة الفنية لأنظمة التشغيل، دعم شبكات الاتصال.",
    applicationDate: "2025-02-10",
    registrationDate: "2025-08-30",
    validityDate: "2035-08-30",
    address: "One Microsoft Way, Redmond, Washington, USA",
    addressAr: "وان مايكروسوفت واي، ريدموند، واشنطن، الولايات المتحدة الأمريكية",
    logoStyle: "stylized-text",
    updatedAt: 1756512000000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "459302",
    proprietor: "ERBIL AL-SULTAN SWEETS & CO",
    proprietorAr: "حلويات السلطان وأولاده - أربيل",
    trademarkName: "AL-SULTAN BAKLAVA",
    trademarkNameAr: "بقلاوة السلطان",
    classNumber: 30,
    goodsServices: "Pastries, traditional sweets, baklava, confectionery, sugar confectionery, and bakery flour preparations.",
    goodsServicesAr: "المعجنات، الحلويات الشرقية والتقليدية، البقلاوة، السكاكر، الحلويات السكرية، ومستحضرات دقيق المخبوزات.",
    applicationDate: "2024-05-22",
    registrationDate: "2024-11-22",
    validityDate: "2034-11-22",
    address: "60 Meter Street, Erbil, Iraq",
    addressAr: "شارع ٦٠ متري، أربيل، العراق",
    logoStyle: "stylized-text",
    updatedAt: 1732233600000,
    status: "active",
    syncStatus: "synced"
  },
  {
    id: "462100",
    proprietor: "IRAQI AIRWAYS COMPANY",
    proprietorAr: "الشركة العامة للخطوط الجوية العراقية",
    trademarkName: "GREEN EAGLE FLYER",
    trademarkNameAr: "طائر النسر الأخضر",
    classNumber: 39,
    goodsServices: "Commercial air transport services of passengers, items and cargo; airline charter planning and travel agency booking.",
    goodsServicesAr: "خدمات النقل الجوي التجاري للمسافرين والأمتعة والبضائع؛ تخطيط الطيران العارض وحجز وكالات السفر والسياحة.",
    applicationDate: "2025-07-18",
    registrationDate: "2026-01-18",
    validityDate: "2036-01-18",
    address: "Baghdad International Airport Area, Baghdad, Iraq",
    addressAr: "منطقة مطار بغداد الدولي، بغداد، العراق",
    logoStyle: "stylized-text",
    updatedAt: 1768694400000,
    status: "active",
    syncStatus: "synced"
  }
];

// Helper to read database
function readDatabase(): TrademarkRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Automatically overwrite the file if it contains the old limited seed list to load premium USPTO experience
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw) as TrademarkRecord[];
      if (parsed.length < 6) {
        console.log("Legacy low-fidelity database detected. Overwriting with premium historical seed set.");
        fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_TRADEMARKS, null, 2), "utf8");
        return SEED_TRADEMARKS;
      }
      return parsed;
    }
    // Write seeds
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_TRADEMARKS, null, 2), "utf8");
    return SEED_TRADEMARKS;
  } catch (err) {
    console.error("Error reading database file, returning seed:", err);
    return SEED_TRADEMARKS;
  }
}

// Helper to write database
function writeDatabase(data: TrademarkRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// Ensure database exists/seeded on load
readDatabase();

// --- API ENDPOINTS ---

// Server health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!ai, clientIp: req.ip });
});

// GET all trademarks
app.get("/api/trademarks", (req, res) => {
  const data = readDatabase();
  res.json(data);
});

// POST save/update a single trademark
app.post("/api/trademarks", (req, res) => {
  const newRecord = req.body as TrademarkRecord;
  if (!newRecord.id) {
    res.status(400).json({ error: "Missing Trademark Registration ID" });
    return;
  }

  const database = readDatabase();
  const index = database.findIndex((t) => t.id === newRecord.id);

  const updatedRecord = {
    ...newRecord,
    updatedAt: Date.now(),
    syncStatus: "synced" as const
  };

  if (index >= 0) {
    database[index] = updatedRecord;
  } else {
    database.push(updatedRecord);
  }

  writeDatabase(database);
  res.json(updatedRecord);
});

// POST - Offline Sync Reconciliation Endpoint
// This merges decentralized timeline edits from clients.
// Uses timestamping (LWW - Last Write Wins) to combine records.
app.post("/api/trademarks/sync", (req, res) => {
  const clientPayload = req.body as { records: TrademarkRecord[] };
  if (!clientPayload || !Array.isArray(clientPayload.records)) {
    res.status(400).json({ error: "Invalid sync request format" });
    return;
  }

  const serverDb = readDatabase();
  const serverMap = new Map<string, TrademarkRecord>(serverDb.map(r => [r.id, r]));
  const clientRecords = clientPayload.records;

  const conflictsToReport: { id: string; local: TrademarkRecord; remote: TrademarkRecord }[] = [];
  const mergedMap = new Map<string, TrademarkRecord>(serverMap);

  for (const clientRec of clientRecords) {
    const serverRec = serverMap.get(clientRec.id);
    if (!serverRec) {
      // Record only exists in client (offline-created). Add to server.
      const syncedClientRec: TrademarkRecord = {
        ...clientRec,
        syncStatus: "synced" as const
      };
      mergedMap.set(clientRec.id, syncedClientRec);
    } else {
      // Exists in both. Compare update times.
      if (clientRec.updatedAt > serverRec.updatedAt) {
        // Client had the newer edit
        const syncedClientRec: TrademarkRecord = {
          ...clientRec,
          syncStatus: "synced" as const
        };
        mergedMap.set(clientRec.id, syncedClientRec);
      } else if (clientRec.updatedAt < serverRec.updatedAt) {
        // Server has newer edit, keep server's but we can notify client
        // No change in serverMap, server version will overwrite client version in return
      } else {
        // Timestamps match. If values are identical, do nothing.
        // If values disagree for the exact same timestamp (rare clock skew offset), flag as conflict.
        if (JSON.stringify(serverRec) !== JSON.stringify({ ...clientRec, syncStatus: "synced" })) {
          conflictsToReport.push({
            id: clientRec.id,
            local: clientRec,
            remote: serverRec
          });
        }
      }
    }
  }

  // Persist the combined state
  const finalMergedList = Array.from(mergedMap.values());
  writeDatabase(finalMergedList);

  res.json({
    mergedRecords: finalMergedList,
    conflictRecords: conflictsToReport,
    serverTime: Date.now()
  });
});

// POST - Gemini Bilingual Translation & Smart Generation Helper
app.post("/api/gemini/translate", async (req, res) => {
  const { text, type } = req.body as { text: string; type: "ar_to_en" | "en_to_ar" | "goods_spec" | "auto_gen" };

  if (!text) {
    res.status(400).json({ error: "Missing text input" });
    return;
  }

  // Generate a random registration date from 2022 to 2026 for realistic historical simulation
  const generateRandomHistoricalDates = () => {
    const startYear = 2022;
    const endYear = 2026;
    const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    
    const pad = (num: number) => num.toString().padStart(2, "0");
    
    // Application Date
    const appDateStr = `${year}-${pad(month)}-${pad(day)}`;
    
    // Registration Date (roughly 6 months later)
    let regMonth = month + 6;
    let regYear = year;
    if (regMonth > 12) {
      regMonth -= 12;
      regYear += 1;
    }
    const regDateStr = `${regYear}-${pad(regMonth)}-${pad(day)}`;
    
    // Protection Validity (Exactly 10 years from the application filing date based on Law 21 of 1957)
    const valYear = year + 10;
    const valDateStr = `${valYear}-${pad(month)}-${pad(day)}`;
    
    return { applicationDate: appDateStr, registrationDate: regDateStr, validityDate: valDateStr };
  };

  // Simulated fallback helper in case Gemini API is not specified or credentials aren't active
  const getFallbackTranslation = (input: string, mode: typeof type) => {
    const term = input.trim().toUpperCase();
    const dates = generateRandomHistoricalDates();
    
    // Simple lookups for typical trademark dictionary phrases
    if (mode === "ar_to_en") {
      if (term === "إم دي أوزال" || term === "محمد أوزال") return "MD UZZAL";
      if (term === "مراسل الغربية ١") return "MURASIL AL-GHARBIYA 1";
      if (term.includes("مياه")) return "Tigris Refined Mineral Water";
      if (term.includes("شركة")) return "Al-Mansour Trading Company";
      if (term.includes("تكنولوجيا")) return "Al-Rafidain technology systems";
      return `Translated (${input})`;
    } else if (mode === "en_to_ar") {
      if (term === "MD UZZAL") return "إم دي أوزال";
      if (term === "MURASIL AL-GHARBIYA 1") return "مراسل الغربية ١";
      if (term.includes("WATER")) return "مياه دجلة الصافية";
      if (term.includes("NEWS")) return "خدمات البث والصحافة الإخبارية";
      if (term.includes("SOLUTIONS")) return "تقنيات الحلول المتقدمة";
      return `مترجم (${input})`;
    } else if (mode === "goods_spec") {
      // class / goods specification suggestion simulation
      return "Suggested Bilingual Clause / البند الثنائي المقترح: Official goods registered under standard Ministry of Trade conditions (مسجل رسمياً بموجب شروط وزارة التجارة المعتمدة).";
    } else {
      // mode auto_gen
      let brandAr = "";
      let brandEn = "";
      
      const containsArabic = /[\u0600-\u06FF]/.test(input);
      if (containsArabic) {
        brandAr = input.replace(/['"]/g, "").trim();
        if (brandAr.includes("أوزال") || brandAr.includes("اوزال")) brandEn = "MD UZZAL";
        else if (brandAr.includes("دجلة")) brandEn = "TIGRIS";
        else if (brandAr.includes("بابل")) brandEn = "BABYLON";
        else if (brandAr.includes("الفرات")) brandEn = "EUPHRATES";
        else if (brandAr.includes("العراق")) brandEn = "IRAQ BRAND";
        else brandEn = "AL-RAFIDAIN";
      } else {
        brandEn = input.replace(/['"]/g, "").trim().toUpperCase();
        const brandLower = brandEn.toLowerCase();
        if (brandLower.includes("uzzal")) brandAr = "إم دي أوزال";
        else if (brandLower.includes("tigris")) brandAr = "دجلة";
        else if (brandLower.includes("babylon")) brandAr = "بابل";
        else if (brandLower.includes("euphrates")) brandAr = "الفرات";
        else if (brandLower.includes("tesla")) brandAr = "تيسلا";
        else if (brandLower.includes("apple")) brandAr = "أبل";
        else if (brandLower.includes("pepsi")) brandAr = "بيبسي";
        else if (brandLower.includes("cola")) brandAr = "كولا";
        else brandAr = `${brandEn} العراق`;
      }

      let suggestedClass = 35; // Default retail business
      let goodsServices = `Scientific research, development and legal protection services; custom retail, import, export and manufacturing protocols for ${brandEn}; general wholesale and retail distribution of commercial goods; strategic business marketing plans, advertising campaigns, and logistical delivery solutions under international Nice class guidelines.`;
      let goodsServicesAr = `أعمال وخدمات البحث العلمي والتطوير والحماية القانونية؛ بروتوكولات تجارة التجزئة المخصصة والاستيراد والتصدير والتصنيع لعلامة ${brandAr}؛ خدمات البيع بالجملة والتجزئة وتوزيع السلع التجارية؛ خطط التسويق الاستراتيجية والحملات الإعلانية والحلول اللوجستية وإدارة المنتجات لعلامة ${brandAr} بموجب تصنيف نيس الدولي.`;
      let address = "Al-Mansour Commercial district, Baghdad, Iraq";
      let addressAr = "المنطقة التجارية بالمنصور، بغداد، جمهورية العراق";

      // Smart classification match based on key concepts
      const brandLower = brandEn.toLowerCase();
      if (brandLower.includes("coffee") || brandLower.includes("cafe") || brandLower.includes("tea") || brandLower.includes("sweet") || brandLower.includes("bakery") || brandLower.includes("baklava")) {
        suggestedClass = 30;
        goodsServices = `High-quality organic roasted coffee beans, premium blends, decaffeinated coffee grinds, instant coffee mixes; hot and cold tea infusions, herbal teas; sweet bakery goods, authentic traditional Iraqi baklava, pastries, biscuits, sugar confectionery, confectionery flavorings, and preparations for making hot beverages under the trademark of ${brandEn}.`;
        goodsServicesAr = `حبوب البن العضوية المحمصة عالية الجودة، خلطات البن الممتازة، البن المطحون الخالي من الكافيين، خلطات القهوة سريعة التحضير؛ الشاي الساخن والبارد، شاي الأعشاب؛ المخبوزات الحلوة، البقلاوة العراقية التقليدية الأصلية، المعجنات، البسكويت، الحلويات السكرية، نكهات الحلويات، والمستحضرات المخصصة لصنع المشروبات الساخنة لعلامة ${brandAr}.`;
        address = "Babylon Plaza, Al-Hindiyah district, Karrada, Baghdad, Iraq";
        addressAr = "بابل بلازا، منطقة الهندية، الكرادة، بغداد، العراق";
      } else if (brandLower.includes("water") || brandLower.includes("cola") || brandLower.includes("drink") || brandLower.includes("pepsi") || brandLower.includes("juice") || brandLower.includes("soda")) {
        suggestedClass = 32;
        goodsServices = `Pure natural mineral drinking water, purified bottled drinking water, spring waters, carbonated and aerated waters; non-alcoholic soft drinks, energy drinks, isotonic beverages; fruit juices, organic fruit nectars, fruit juice concentrates, syrups and other preparations for making non-alcoholic beverages under the trademark of ${brandEn}.`;
        goodsServicesAr = `مياه الشرب المعدنية الطبيعية النقية، مياه الشرب المعبأة المصفاة، مياه الينابيع، المياه الغازية والمياه الفوارة؛ المشروبات الغازية غير الكحولية، مشروبات الطاقة، المشروبات الرياضية؛ عصائر الفواكه، نكتار الفواكه العضوية، مركزات عصائر الفواكه، شراب الفواكه والمستحضرات الأخرى لصنع المشروبات غير الكحولية لعلامة ${brandAr}.`;
        address = "Al-Senak Industrial District, Baghdad, Iraq";
        addressAr = "المنطقة الصناعية بالسنك، بغداد، العراق";
      } else if (brandLower.includes("car") || brandLower.includes("vehicle") || brandLower.includes("tesla") || brandLower.includes("motor") || brandLower.includes("toyota") || brandLower.includes("wheel") || brandLower.includes("truck")) {
        suggestedClass = 12;
        goodsServices = `Electric vehicles, structural automotive components, drive electric motors, land transit carriages, safety airbags, braking systems, interior passenger cabins, and parts and fittings for cars, vans and electric transports carrying the trademark name ${brandEn}.`;
        goodsServicesAr = `المركبات الكهربائية، المكونات الهيكلية للسيارات، محركات الدفع الكهربائية، عربات النقل البري، الوسائد الهوائية للأمان، أنظمة المكابح، الكبائن الداخلية للركاب، وقطع الغيار والملحقات المخصصة للسيارات والشاحنات ووسائل النقل الكهربائية الحاملة للعلامة ${brandAr}.`;
      } else if (brandLower.includes("computer") || brandLower.includes("app") || brandLower.includes("software") || brandLower.includes("phone") || brandLower.includes("apple") || brandLower.includes("microsoft") || brandLower.includes("system") || brandLower.includes("security")) {
        suggestedClass = 9;
        goodsServices = `Operating computer software, downloadable mobile security systems applications, cloud database storage nodes, microprocessors, smart electronic tablets, computer peripherals, and encrypted data communication networks under the trademark of ${brandEn}.`;
        goodsServicesAr = `برامج تشغيل الكمبيوتر، تطبيقات أنظمة الحماية للهواتف المحمولة القابلة للتنزيل، عقد تخزين قواعد البيانات السحابية، المعالجات الدقيقة، الأجهزة اللوحية الإلكترونية الذكية، ملحقات الكمبيوتر، وشبكات نقل البيانات المشفرة لعلامة ${brandAr}.`;
        address = "Waziriyah IT Park, Baghdad, Iraq";
        addressAr = "مجمع تكنولوجيا المعلومات بالوزيرية، بغداد، العراق";
      } else if (brandLower.includes("news") || brandLower.includes("tv") || brandLower.includes("channel") || brandLower.includes("media") || brandLower.includes("radio") || brandLower.includes("buzz") || brandLower.includes("uzzal") || brandLower.includes("murasil")) {
        suggestedClass = 41;
        goodsServices = `Official news reporters services, broadcasting of television over satellite and cable, digital publishing of internet content, audio podcasts, documentary cinema production, and media photography reporting under the trademark of ${brandEn}.`;
        goodsServicesAr = `خدمات مراسلي الأخبار الرسمية، البث التلفزيوني عبر الأقمار الصناعية والكابل، النشر الرقمي لمحتوى الإنترنت، البودكاست الصوتي، إنتاج الأفلام الوثائقية، والتقارير المصورة لـ ${brandAr}.`;
      } else if (brandLower.includes("paint") || brandLower.includes("coat") || brandLower.includes("varnish") || brandLower.includes("color")) {
        suggestedClass = 2;
        goodsServices = `Premium industrial paints, anti-rust coatings, protective wood preservation lacquers, interior structural varnishes, and raw pigment colorants for commercial manufacture under the trademark of ${brandEn}.`;
        goodsServicesAr = `الدهانات الصناعية الفاخرة، طلاءات مقاومة الصدأ، ورنيش حماية الأخشاب الواقي، الأصباغ الهيكلية الداخلية، والملونات الخام للتصنيع التجاري لعلامة ${brandAr}.`;
      } else if (brandLower.includes("medicine") || brandLower.includes("pharma") || brandLower.includes("clinic") || brandLower.includes("medical") || brandLower.includes("health")) {
        suggestedClass = 5;
        goodsServices = `Pharmaceutical preparations for treating metabolic disorders, clinical medical diagnostic reagents, dietary and nutritional supplements, and hygienic chemical disinfecting agents for medical centers under the trademark of ${brandEn}.`;
        goodsServicesAr = `المستحضرات الصيدلانية لعلاج اضطرابات التمثيل الغذائي، كواشف التشخيص الطبي السريري، المكملات الغذائية والغذائية الخاصة، والمواد الكيميائية المعقمة للمراكز الطبية لعلامة ${brandAr}.`;
        address = "Bab Al-Moadham Medical Hub, Baghdad, Iraq";
        addressAr = "المجمع الطبي بباب المعظم، بغداد، العراق";
      }

      return JSON.stringify({
        trademarkName: brandEn,
        trademarkNameAr: brandAr,
        proprietor: `${brandEn} HOLDINGS CORP`,
        proprietorAr: `شركة ${brandAr} المساهمة`,
        classNumber: suggestedClass,
        goodsServices,
        goodsServicesAr,
        address,
        addressAr,
        applicationDate: dates.applicationDate,
        registrationDate: dates.registrationDate,
        validityDate: dates.validityDate,
        isMock: true
      });
    }
  };

  if (!ai) {
    // Return mock response directly
    const mockRep = getFallbackTranslation(text, type);
    if (type === "auto_gen") {
      res.json(JSON.parse(mockRep));
    } else {
      res.json({
        translatedText: mockRep,
        isMock: true,
        suggestedClass: type === "goods_spec" ? (text.toLowerCase().includes("news") ? 41 : 32) : undefined
      });
    }
    return;
  }

  try {
    let prompt = "";
    if (type === "ar_to_en") {
      prompt = `You are an expert bilingual legal translator for the Republic of Iraq Ministry of Trade Trademark Registry. Translate this Arabic trademark field or proprietor name to clear, official English (in ALL CAPS for name, or normal Title Case if address). Do not write anything else but the direct English translation.\n\nText: ${text}`;
    } else if (type === "en_to_ar") {
      prompt = `You are an expert bilingual legal translator for the Republic of Iraq Ministry of Trade Trademark Registry. Translate this English trademark name, proprietor name or address to authentic standard Arabic (فصحى) used in Iraqi official records. Do not write anything else but the direct Arabic translation.\n\nText: ${text}`;
    } else if (type === "goods_spec") {
      prompt = `You are an expert Iraq Trademark Classification assistant. Design a highly professional bilingual (English and Arabic) specification of Goods and Services based on this raw input description: "${text}". 
      Also, classify this description into one of the 45 international trademark classes (NICE classification).
      Return your answer strictly as a JSON object with two fields (do not use any Markdown block wrapper, write raw JSON):
      {
        "translatedText": "English translation / Arabic translation format separating clauses with semicolons",
        "suggestedClass": 41 (Integer class between 1 and 45)
      }`;
    } else if (type === "auto_gen") {
      // Complete brand autocomplete generator using Gemini 3.5 Flash
      prompt = `You are a legal registrar in charge of the Republic of Iraq Ministry of Trade Intellectual Property ledger. 
      I will give you a brand name or category concept, and you must automatically generate a highly realistic, legally compliant trademark registration profile.
      
      Input Brand Concept: "${text}"
      
      Determine the correct International Nice Classification class (integer between 1 and 45) matching this concept, and output a detailed goods/services clause in BOTH professional English and official administrative Arabic.
      
      CRITICAL INSTRUCTIONS:
      - AUTO TRANSLATION & TRANSLITERATION: Whichever language the Input Brand Concept is entered in (Arabic, English, Spanish, Bengali, etc.), you must detect the brand name, and translate/transliterate it consistently for BOTH:
        1. trademarkName: Capitalized English transliteration/translation of the brand name (e.g., 'MD UZZAL GROUP', 'TIGRIS COFFEE', 'AL-KARRADA NEWS').
        2. trademarkNameAr: Official, authentic Arabic translation/transliteration of the brand name (e.g., 'مجموعة إم دي أوزال', 'قهوة دجلة', 'أخبار الكرادة').
        The two fields MUST represent the exact same brand name in English and Arabic. They must not diverge or hallucinate separate names.
      - DETAILED EXHAUSTIVE SPECIFICATIONS: Make "goodsServices" and "goodsServicesAr" extremely detailed, consisting of multiple long lines/sentences (at least 3-4 comprehensive lines of professional boilerplates) detailing the respective goods/services of the brand.
      
      Also formulate:
      - Proprietor Name (representative of a corporate entity containing the translated brand name - English and Arabic)
      - Realistic address in Iraq (e.g. Al-Mansour, Al-Karrada, or Erbil), representing offices in BOTH English and Arabic.
      
      You MUST return your answer strictly as a raw JSON string. Do not markdown wrap it in \`\`\`json. The output MUST exactly follow this schema:
      {
        "trademarkName": "TRADEMARK NAME IN CAPITAL ENGLISH",
        "trademarkNameAr": "الاسم بالعربية",
        "proprietor": "PROPRIETOR CORPORATE NAME IN CAPITAL ENGLISH",
        "proprietorAr": "اسم مالك المؤسسة بالعربية",
        "classNumber": 9 (an Integer from 1 to 45 matching the Nice class of the brand),
        "goodsServices": "Exhaustive legal specification clause of goods and services in English summarizing the brand category (multiple sentences, high line count)",
        "goodsServicesAr": "صيغة تفصيلية مطولة للسلع والخدمات القانونية باللغة العربية الفصحى (جمل متعددة وسطور كثيرة)",
        "address": "Official business street address in Iraq (English)",
        "addressAr": "العنوان الرسمي في العراق باللغة العربية"
      }
      
      Make the terms incredibly premium, official, and authentic sounding, avoiding generic placeholders.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: (type === "goods_spec" || type === "auto_gen") ? "application/json" : "text/plain",
        systemInstruction: "You are an official bilingual legal registrar specializing in Iraqi trademark registrations and Nice international goods classifications."
      }
    });

    const resultText = response.text || "";

    if (type === "goods_spec") {
      try {
        const parsed = JSON.parse(resultText.trim());
        res.json({
          translatedText: parsed.translatedText,
          suggestedClass: parsed.suggestedClass,
          isMock: false
        });
      } catch (parseErr) {
        res.json({
          translatedText: resultText,
          suggestedClass: text.toLowerCase().includes("news") ? 41 : 32,
          isMock: false
        });
      }
    } else if (type === "auto_gen") {
      try {
        const parsed = JSON.parse(resultText.trim());
        const dates = generateRandomHistoricalDates();
        // Inject dates and return complete record info
        res.json({
          ...parsed,
          applicationDate: dates.applicationDate,
          registrationDate: dates.registrationDate,
          validityDate: dates.validityDate,
          isMock: false
        });
      } catch (parseErr) {
        // Fallback in case of parse error
        const fallback = JSON.parse(getFallbackTranslation(text, "auto_gen"));
        res.json(fallback);
      }
    } else {
      res.json({
        translatedText: resultText.trim(),
        isMock: false
      });
    }

  } catch (err: any) {
    console.error("Gemini Translation API call failed, reverting to simulation fallback:", err);
    if (type === "auto_gen") {
      const fallback = JSON.parse(getFallbackTranslation(text, "auto_gen"));
      res.json(fallback);
    } else {
      res.json({
        translatedText: getFallbackTranslation(text, type),
        isMock: true,
        errorLog: err.message,
        suggestedClass: type === "goods_spec" ? (text.toLowerCase().includes("news") ? 41 : 9) : undefined
      });
    }
  }
});

// Configure Vite or Static File Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(` Iraq Trademark Database Server listening on http://localhost:${PORT}`);
  });
}

startServer();
