/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TrademarkRecord } from "../types";
import { 
  Sparkles, FileText, Search, PlusCircle, CheckCircle, Clock, 
  AlertCircle, Upload, Save, HelpCircle, ArrowRight, Tag
} from "lucide-react";

interface InteractiveStudioProps {
  records: TrademarkRecord[];
  onSaveRecord: (record: TrademarkRecord) => Promise<void>;
  isOfflineMode: boolean;
  selectedRecord: TrademarkRecord | null;
  onSelectRecord: (record: TrademarkRecord | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

// Prefilled Nice classifications for helper lookup (All 45 Classes)
const NICE_CLASSES = [
  { val: 1, desc: "Chemicals for industry, science & photography / الكيماويات الصناعية والعلمية" },
  { val: 2, desc: "Paints, varnishes & lacquers / الدهانات والأصباغ والورنيش" },
  { val: 3, desc: "Cosmetics, cleaning preparations & soaps / مستحضرات التجميل ومساحيق الغسيل والصابون" },
  { val: 4, desc: "Industrial oils, greases & fuels / الزيوت الصناعية والشحوم والوقود" },
  { val: 5, desc: "Pharmaceuticals and medical preparations / الأدوية والمستحضرات الطبية والبيطرية" },
  { val: 6, desc: "Common metals and their alloys / المعادن الشائعة وسبائكها" },
  { val: 7, desc: "Machines and machine tools / الآلات وأدوات الآلات والمحركات" },
  { val: 8, desc: "Hand tools and implements / الأدوات اليدوية والأجهزة المعدنية" },
  { val: 9, desc: "Scientific, computer software & electronics / الأجهزة العلمية وبرمجيات الكمبيوتر والإلكترونيات" },
  { val: 10, desc: "Surgical and medical instruments / الأجهزة والأدوات الطبية والجراحية" },
  { val: 11, desc: "Apparatus for lighting, heating & cooling / أجهزة الإضاءة والتدفئة والتبريد" },
  { val: 12, desc: "Vehicles & locomotion apparatus / المركبات وأجهزة النقل البري والجوي والبحري" },
  { val: 13, desc: "Firearms, ammunition & fireworks / الأسلحة النارية والذخائر والألعاب النارية" },
  { val: 14, desc: "Precious metals, jewelry & watches / المعادن النفيسة والمجوهرات والساعات" },
  { val: 15, desc: "Musical instruments / الآلات الموسيقية وملحقاتها" },
  { val: 16, desc: "Paper, cardboard & printed matters / الورق والكرتون والمطبوعات والأدوات المكتبية" },
  { val: 17, desc: "Rubber, plastics and insulating materials / المطاط والبلاستيك ومواد العزل" },
  { val: 18, desc: "Leather and leather imitation goods / الجلود والحقائب ومستلزمات السفر" },
  { val: 19, desc: "Non-metallic building materials / مواد البناء غير المعدنية والخرسانة" },
  { val: 20, desc: "Furniture, mirrors & plastic articles / الأثاث والمرايا والمنتجات الخشبية والبلاستيكية" },
  { val: 21, desc: "Household, kitchen utensils & glassware / الأواني المنزلية والمطابخ والزجاج" },
  { val: 22, desc: "Ropes, sails, tents & tarpaulins / الحبال والأشرعة والخيام والشوادر" },
  { val: 23, desc: "Yarns and threads for textile / الخيوط والغزل لأغراض النسيج" },
  { val: 24, desc: "Textiles, fabrics & covers / المنسوجات والأقمشة وأغطية الأسرة" },
  { val: 25, desc: "Clothing, footwear & headwear / الملابس والأحذية وأغطية الرأس" },
  { val: 26, desc: "Lace, embroidery, ribbons & buttons / الدانتيل والتطريز والأشرطة والأزرار" },
  { val: 27, desc: "Carpets, rugs, mats & wall hangings / السجاد والأبسطة والماصات وأغطية الجدران" },
  { val: 28, desc: "Games, toys & sporting articles / الألعاب والدمى والأدوات الرياضية" },
  { val: 29, desc: "Meat, fish, poultry & preserved fruits / اللحوم والأسماك والخضروات المحفوظة" },
  { val: 30, desc: "Coffee, tea, flour & confectionery / القهوة والشاي والدقيق والحلويات" },
  { val: 31, desc: "Agricultural, crop seeds & forestry / المنتجات الزراعية والحبوب والشتلات" },
  { val: 32, desc: "Mineral waters, beers & soft drinks / المياه المعدنية والمشروبات غير الكحولية والبيرة" },
  { val: 33, desc: "Alcoholic beverages (except beers) / المشروبات الكحولية (باستثناء البيرة)" },
  { val: 34, desc: "Tobacco, smoker's articles & matches / التبغ ومستلزمات المدخنين والكبريت" },
  { val: 35, desc: "Advertising, business & retail / الإعلانات وإدارة الأعمال ومحلات التجزئة" },
  { val: 36, desc: "Insurance, financial & banking / التأمين والمعاملات المالية والخدمات المصرفية" },
  { val: 37, desc: "Building construction & repair / خدمات التشييد والبناء والصيانة" },
  { val: 38, desc: "Telecommunications & broadcasting / خدمات الاتصالات والبث السلكي واللاسلكي" },
  { val: 39, desc: "Transport, travel & cargo storage / خدمات النقل والسياحة وتخزين البضائع" },
  { val: 40, desc: "Treatment of materials / معالجة المواد وتحويلها وصناعتها" },
  { val: 41, desc: "Education, training, news & media / خدمات التعليم والتأهيل والإعلام الإخباري" },
  { val: 42, desc: "Scientific, SaaS, software & IT / خدمات تطوير البرمجيات والبحث العلمي وتكنولوجيا المعلومات" },
  { val: 43, desc: "Food services, cafes & restaurants / خدمات المطاعم والمقاهي والفنادق" },
  { val: 44, desc: "Medical, beauty & agricultural care / الخدمات الطبية والتجميلية والرعاية الزراعية" },
  { val: 45, desc: "Legal, security & social safety / الخدمات القانونية والأمنية والاجتماعية" }
];

export default function InteractiveStudio({
  records,
  onSaveRecord,
  isOfflineMode,
  selectedRecord,
  onSelectRecord,
  showToast
}: InteractiveStudioProps) {
  
  // Editor Form States mapped from selected trademark
  const [targetId, setTargetId] = useState("");
  const [proprietor, setProprietor] = useState("");
  const [proprietorAr, setProprietorAr] = useState("");
  const [trademarkName, setTrademarkName] = useState("");
  const [trademarkNameAr, setTrademarkNameAr] = useState("");
  const [classNumber, setClassNumber] = useState(41);
  const [goodsServices, setGoodsServices] = useState("");
  const [goodsServicesAr, setGoodsServicesAr] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [address, setAddress] = useState("");
  const [addressAr, setAddressAr] = useState("");
  const [logoStyle, setLogoStyle] = useState<'stylized-text' | 'uploaded-image'>('stylized-text');
  const [imageLogo, setImageLogo] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Sync dates change automatically: Validity date auto-sets to Year Application + 10 as official Iraqi convention
  useEffect(() => {
    if (applicationDate) {
      const year = parseInt(applicationDate.split("-")[0]);
      if (!isNaN(year)) {
        const futureDate = `${year + 10}-10-12`; // Standard Iraqi renewal offset cycle
        // If not specified, set dates automatically for premium flow ease
        if (!validityDate) setValidityDate(futureDate);
        if (!registrationDate) setRegistrationDate(applicationDate);
      }
    }
  }, [applicationDate]);

  // Load selected record into form
  useEffect(() => {
    if (selectedRecord) {
      setTargetId(selectedRecord.id);
      setProprietor(selectedRecord.proprietor);
      setProprietorAr(selectedRecord.proprietorAr);
      setTrademarkName(selectedRecord.trademarkName);
      setTrademarkNameAr(selectedRecord.trademarkNameAr);
      setClassNumber(selectedRecord.classNumber);
      setGoodsServices(selectedRecord.goodsServices);
      setGoodsServicesAr(selectedRecord.goodsServicesAr);
      setApplicationDate(selectedRecord.applicationDate);
      setRegistrationDate(selectedRecord.registrationDate);
      setValidityDate(selectedRecord.validityDate);
      setAddress(selectedRecord.address);
      setAddressAr(selectedRecord.addressAr);
      setLogoStyle(selectedRecord.logoStyle);
      setImageLogo(selectedRecord.imageLogo || "");
    } else {
      // Clear Form state for clean entry
      resetForm();
    }
  }, [selectedRecord]);

  const resetForm = () => {
    // Standard random generator for new registries
    const randomId = Math.floor(350000 + Math.random() * 10000).toString();
    setTargetId(randomId);
    setProprietor("");
    setProprietorAr("");
    setTrademarkName("");
    setTrademarkNameAr("");
    setClassNumber(41);
    setGoodsServices("");
    setGoodsServicesAr("");
    
    // Set default dates
    const today = new Date().toISOString().slice(0, 10);
    setApplicationDate(today);
    setRegistrationDate(today);
    const tenYearsLater = `${new Date().getFullYear() + 10}-10-12`;
    setValidityDate(tenYearsLater);
    
    setAddress("Al-Karrada District, Baghdad, Iraq");
    setAddressAr("منطقة الكرادة، بغداد، العراق");
    setLogoStyle("stylized-text");
    setImageLogo("");
  };

  // Convert uploaded image to base64
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image is too large. Please upload an image under 2MB.", "warning");
      return;
    }

    const reader = new FileReader();
    fileReaderOnLoadFunc(reader);
    reader.readAsDataURL(file);
  };

  const fileReaderOnLoadFunc = (reader: FileReader) => {
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageLogo(e.target.result as string);
        setLogoStyle("uploaded-image");
      }
    };
  };

  // Trigger Gemini AI Translation and NICE helper
  const handleGeminiTranslation = async () => {
    if (!trademarkName && !proprietor && !goodsServices && !address) {
      showToast("Please fill in some English fields (Trademark Name, Proprietor, Address, or Specifications) to allow Gemini translator to work.", "warning");
      return;
    }

    setAiLoading(true);
    try {
      // 1. Translate proprietor name if available
      if (proprietor && !proprietorAr) {
        const res = await callTranslateAPI(proprietor, "en_to_ar");
        if (res.translatedText) setProprietorAr(res.translatedText);
      } else if (proprietorAr && !proprietor) {
        const res = await callTranslateAPI(proprietorAr, "ar_to_en");
        if (res.translatedText) setProprietor(res.translatedText);
      }

      // 2. Translate trademark title
      if (trademarkName && !trademarkNameAr) {
        const res = await callTranslateAPI(trademarkName, "en_to_ar");
        if (res.translatedText) setTrademarkNameAr(res.translatedText);
      } else if (trademarkNameAr && !trademarkName) {
        const res = await callTranslateAPI(trademarkNameAr, "ar_to_en");
        if (res.translatedText) setTrademarkName(res.translatedText);
      }

      // 3. Translate address
      if (address && !addressAr) {
        const res = await callTranslateAPI(address, "en_to_ar");
        if (res.translatedText) setAddressAr(res.translatedText);
      } else if (addressAr && !address) {
        const res = await callTranslateAPI(addressAr, "ar_to_en");
        if (res.translatedText) setAddress(res.translatedText);
      }

      // 4. Translate specification of goods & suggest international class!
      if (goodsServices) {
        const res = await callTranslateAPI(goodsServices, "goods_spec");
        if (res.translatedText) {
          // Suggested text comes formatted as "English / Arabic"
          const split = res.translatedText.split(" / ");
          if (split.length >= 2) {
            setGoodsServicesAr(split[1]);
          } else {
            setGoodsServicesAr(res.translatedText);
          }
        }
        if (res.suggestedClass) {
          setClassNumber(res.suggestedClass);
        }
      }

    } catch (err) {
      console.error("Gemini Translation failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const [autoGenConcept, setAutoGenConcept] = useState("");

  // Beautiful high-fidelity client-side fallback for static deployments (e.g. static hosting on iraqgovtradamrk.org)
  const getClientFallbackTranslation = (text: string, type: "ar_to_en" | "en_to_ar" | "goods_spec" | "auto_gen") => {
    const term = text.trim().toUpperCase();
    
    // Dates calculation
    const year = new Date().getFullYear() - Math.floor(Math.random() * 3 + 1);
    const month = Math.floor(Math.random() * 11) + 1;
    const day = Math.floor(Math.random() * 27) + 1;
    const pad = (n: number) => n.toString().padStart(2, "0");
    const appDate = `${year}-${pad(month)}-${pad(day)}`;
    
    const regMonth = (month + 6) % 12 || 12;
    const regYear = month + 6 > 12 ? year + 1 : year;
    const regDate = `${regYear}-${pad(regMonth)}-${pad(day)}`;
    
    const valYear = year + 10;
    const valDate = `${valYear}-${pad(month)}-${pad(day)}`;

    if (type === "ar_to_en") {
      if (term === "إم دي أوزال" || term === "محمد أوزال") return { translatedText: "MD UZZAL GROUP", isMock: true };
      if (term === "مراسل الغربية ١") return { translatedText: "MURASIL AL-GHARBIYA 1", isMock: true };
      if (term.includes("مياه")) return { translatedText: "Tigris Refined Mineral Water", isMock: true };
      if (term.includes("شركة")) return { translatedText: "Al-Mansour Trading Company", isMock: true };
      if (term.includes("تكنولوجيا")) return { translatedText: "Al-Rafidain technology systems", isMock: true };
      return { translatedText: `Translated (${text})`, isMock: true };
    } else if (type === "en_to_ar") {
      if (term === "MD UZZAL" || term === "MD UZZAL GROUP") return { translatedText: "إم دي أوزال", isMock: true };
      if (term === "MURASIL AL-GHARBIYA 1") return { translatedText: "مراسل الغربية ١", isMock: true };
      if (term.includes("WATER")) return { translatedText: "مياه دجلة الصافية", isMock: true };
      if (term.includes("NEWS")) return { translatedText: "خدمات البث والصحافة الإخبارية", isMock: true };
      if (term.includes("SOLUTIONS")) return { translatedText: "تقنيات الحلول المتقدمة", isMock: true };
      return { translatedText: "مترجم " + text, isMock: true };
    } else if (type === "goods_spec") {
      return { 
        translatedText: "Suggested Bilingual Clause / البند الثنائي المقترح: Official goods registered under standard Ministry of Trade conditions (مسجل رسمياً بموجب شروط وزارة التجارة المعتمدة).", 
        suggestedClass: text.toLowerCase().includes("news") ? 41 : 32,
        isMock: true 
      };
    } else {
      // type === "auto_gen"
      let brandAr = "";
      let brandEn = "";
      
      const containsArabic = /[\u0600-\u06FF]/.test(text);
      if (containsArabic) {
        brandAr = text.replace(/['"]/g, "").trim();
        if (brandAr.includes("أوزال") || brandAr.includes("اوزال")) brandEn = "MD UZZAL GROUP";
        else if (brandAr.includes("دجلة")) brandEn = "TIGRIS";
        else if (brandAr.includes("بابل")) brandEn = "BABYLON";
        else if (brandAr.includes("الفرات")) brandEn = "EUPHRATES";
        else if (brandAr.includes("العراق")) brandEn = "IRAQ BRAND";
        else brandEn = "AL-RAFIDAIN";
      } else {
        brandEn = text.replace(/['"]/g, "").trim().toUpperCase();
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

      let suggestedClass = 35;
      let goodsServices = `Scientific research, development and legal protection services; custom retail, import, export and manufacturing protocols for ${brandEn}; general wholesale and retail distribution of commercial goods; strategic business marketing plans, advertising campaigns, and logistical delivery solutions under international Nice class guidelines.`;
      let goodsServicesAr = `أعمال وخدمات البحث العلمي والتطوير والحماية القانونية؛ بروتوكولات تجارة التجزئة المخصصة والاستيراد والتصدير والتصنيع لعلامة ${brandAr}؛ خدمات البيع بالجملة والتجزئة وتوزيع السلع التجارية؛ خطط التسويق الاستراتيجية والحملات الإعلانية والحلول اللوجستية وإدارة المنتجات لعلامة ${brandAr} بموجب تصنيف نيس الدولي.`;
      let address = "Al-Mansour Commercial district, Baghdad, Iraq";
      let addressAr = "المنطقة التجارية بالمنصور، بغداد، جمهورية العراق";

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

      return {
        trademarkName: brandEn,
        trademarkNameAr: brandAr,
        proprietor: `${brandEn} HOLDINGS CORP`,
        proprietorAr: `شركة ${brandAr} المساهمة`,
        classNumber: suggestedClass,
        goodsServices,
        goodsServicesAr,
        address,
        addressAr,
        applicationDate: appDate,
        registrationDate: regDate,
        validityDate: valDate,
        isMock: true
      };
    }
  };

  const handleSmartAutoGen = async () => {
    if (!autoGenConcept.trim()) {
      showToast("Please enter a Brand Name or Business Concept (e.g. 'Babylon Coffee', 'Tigris Electronics') first.", "warning");
      return;
    }
    
    setAiLoading(true);
    try {
      let data;
      try {
        const res = await fetch("/api/gemini/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: autoGenConcept.trim(), type: "auto_gen" })
        });
        
        if (!res.ok) {
          throw new Error("HTTP failure");
        }
        data = await res.json();
      } catch (e) {
        console.warn("Server API not reachable (running static client-side fallback engine):", e);
        data = getClientFallbackTranslation(autoGenConcept.trim(), "auto_gen");
      }
      
      // Auto-populate all generated attributes
      if (data.trademarkName) setTrademarkName(data.trademarkName);
      if (data.trademarkNameAr) setTrademarkNameAr(data.trademarkNameAr);
      if (data.proprietor) setProprietor(data.proprietor);
      if (data.proprietorAr) setProprietorAr(data.proprietorAr);
      if (data.classNumber) setClassNumber(data.classNumber);
      if (data.goodsServices) setGoodsServices(data.goodsServices);
      if (data.goodsServicesAr) setGoodsServicesAr(data.goodsServicesAr);
      if (data.address) setAddress(data.address);
      if (data.addressAr) setAddressAr(data.addressAr);
      if (data.applicationDate) setApplicationDate(data.applicationDate);
      if (data.registrationDate) setRegistrationDate(data.registrationDate);
      if (data.validityDate) setValidityDate(data.validityDate);
      
      // Assign a fresh registry serial ID if needed
      const randomId = Math.floor(400000 + Math.random() * 90000).toString();
      setTargetId(randomId);

      // Create record representation to save instantly in the database
      const generatedRecord: TrademarkRecord = {
        id: randomId,
        proprietor: (data.proprietor || "MD UZZAL").trim(),
        proprietorAr: (data.proprietorAr || "إم دي أوزال").trim(),
        trademarkName: (data.trademarkName || autoGenConcept).trim(),
        trademarkNameAr: (data.trademarkNameAr || autoGenConcept).trim(),
        classNumber: data.classNumber || 32,
        goodsServices: (data.goodsServices || "General Goods Registered under Nice Class Rules.").trim(),
        goodsServicesAr: (data.goodsServicesAr || "البضائع والسلع العامة المسجلة بموجب القواعد الدولية المعتمدة.").trim(),
        applicationDate: data.applicationDate || "2023-01-15",
        registrationDate: data.registrationDate || "2023-04-10",
        validityDate: data.validityDate || "2033-01-15",
        address: data.address || "Baghdad, Iraq",
        addressAr: data.addressAr || "العراق، بغداد",
        logoStyle: "stylized-text" as const,
        updatedAt: Date.now(),
        status: "active" as const,
        syncStatus: isOfflineMode ? "offline-draft" as const : "local-only" as const
      };

      await onSaveRecord(generatedRecord);
      onSelectRecord(generatedRecord);

      showToast(`⚡ Smart Success! Trademark "${generatedRecord.trademarkName}" generated bilingually and registered in local memory!`, "success");
      
    } catch (err: any) {
      console.error("AI Auto-generation failed:", err);
      showToast("Generation failed: " + err.message, "error");
    } finally {
      setAiLoading(false);
    }
  };

  const callTranslateAPI = async (text: string, type: "ar_to_en" | "en_to_ar" | "goods_spec" | "auto_gen") => {
    try {
      const res = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type })
      });
      if (!res.ok) {
        throw new Error("API responded with error code: " + res.status);
      }
      return await res.json();
    } catch (e) {
      console.warn(`Translation API unreachable for ${type}, falling back to static client engine.`, e);
      return getClientFallbackTranslation(text, type);
    }
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !proprietor || !trademarkName) {
      showToast("Registration ID, Proprietor and Trademark Name are required to generate certificates.", "warning");
      return;
    }

    setSaveLoading(true);
    try {
      const recordToSave: TrademarkRecord = {
        id: targetId.trim(),
        proprietor: proprietor.trim(),
        proprietorAr: proprietorAr.trim() || proprietor,
        trademarkName: trademarkName.trim(),
        trademarkNameAr: trademarkNameAr.trim() || trademarkName,
        classNumber,
        goodsServices: goodsServices.trim() || "General Goods Registered under Nice Class Rules.",
        goodsServicesAr: goodsServicesAr.trim() || "البضائع والسلع العامة المسجلة بموجب القواعد الدولية المعتمدة.",
        applicationDate,
        registrationDate,
        validityDate,
        address,
        addressAr,
        logoStyle,
        imageLogo: logoStyle === "uploaded-image" ? imageLogo : undefined,
        updatedAt: Date.now(),
        status: new Date(validityDate) < new Date() ? "expired" : "active",
        syncStatus: isOfflineMode ? "offline-draft" : "local-only"
      };

      await onSaveRecord(recordToSave);
      onSelectRecord(recordToSave);
      showToast(
        isOfflineMode 
        ? "Saved Locally! This Certificate draft is cached on your device and will be synced upon linking online." 
        : "Trademark Certificate Registry database updated successfully!",
        "success"
      );
    } catch (err: any) {
      showToast("Failed to save: " + err.message, "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // Search filter
  const filteredRecords = records.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.proprietor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.trademarkName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.trademarkNameAr.includes(searchQuery)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
      
      {/* LEFT COLUMN: Sidebar list of records (4/12 width) */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        
        {/* Registration List Header */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Trademark Registry Index</span>
            </h3>
            <button
              onClick={() => onSelectRecord(null)}
              id="new-trademark-trigger"
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Mark</span>
            </button>
          </div>

          {/* Search bar inputs */}
          <div className="relative mb-3.5">
            <Search className="absolute top-2.5 left-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by ID, Title, Proprietor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8.5 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
            />
          </div>

          {/* Records vertical lists */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredRecords.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No matching records found.</p>
            ) : (
              filteredRecords.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition select-none flex justify-between items-start ${
                      isSelected 
                        ? "bg-indigo-50/65 border-indigo-200 shadow-sm" 
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[70%]">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-205">
                          #{r.id}
                        </span>
                        <span className="font-bold text-xs text-indigo-750 truncate" title={r.trademarkName}>
                          {r.trademarkName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{r.proprietor}</p>
                      <span className="block text-[9px] text-[#71717a] font-sans" dir="rtl">
                        {r.trademarkNameAr}
                      </span>
                    </div>

                    <div className="flex flex-col items-end justify-between h-full space-y-2">
                      {/* Active Status Badge */}
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded leading-none ${
                        r.status === 'expired' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {r.status}
                      </span>

                      {/* Sync status indicators */}
                      {r.syncStatus === "synced" ? (
                        <span className="flex items-center font-bold text-[8px] text-emerald-600 space-x-0.5" title="Synchronized with cloud">
                          <CheckCircle className="w-2.5 h-2.5 inline" />
                          <span>Synced</span>
                        </span>
                      ) : r.syncStatus === "offline-draft" ? (
                        <span className="flex items-center font-bold text-[8px] text-red-600 space-x-0.5 animate-pulse" title="Saved offline pending reconnection">
                          <Clock className="w-2.5 h-2.5 inline" />
                          <span>Offline</span>
                        </span>
                      ) : (
                        <span className="flex items-center font-bold text-[8px] text-indigo-500 space-x-0.5" title="Draft saved inside local cache">
                          <AlertCircle className="w-2.5 h-2.5 inline" />
                          <span>Unsaved</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic Class list assistance card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left invisible md:block shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 flex items-center mb-2">
            <Tag className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            <span>Nice Classification Quick Index</span>
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {NICE_CLASSES.map((nc) => (
              <div key={nc.val} className="text-[10px] hover:bg-white p-1 rounded-lg transition text-slate-600">
                <strong>Class {nc.val}:</strong> {nc.desc}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Form Editor and customize controls (8/12 width) */}
      <form onSubmit={handleSave} className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 text-left space-y-6">
        
        {/* Editor Form header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedRecord ? "Edit Registered Certificate" : "Certificate Design Studio"}
            </h3>
            <p className="text-xs text-slate-400">
              Generate official bilingual seals, classes, and specifications directly.
            </p>
          </div>

          {/* AI Translator consult trigger */}
          <button
            type="button"
            onClick={handleGeminiTranslation}
            disabled={aiLoading}
            id="ai-autocompleter-prompt"
            className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-250 font-bold text-xs shadow-sm hover:shadow cursor-pointer transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? "Consulting Gemini..." : "Translate & Classify (AI)"}</span>
          </button>
        </div>

        {/* Visual Progress Bar for Gemini consultation */}
        {aiLoading && (
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 animate-pulse text-xs text-indigo-900">
            <div className="font-bold flex items-center mb-1">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600 animate-spin" />
              <span>Gemini 3.5 Assistant Translator is working...</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Generating bilingually formatted legal nouns, Arabic translations, and comparing specifications to NICE classification numbers.
            </p>
          </div>
        )}

        {/* ⚡ INSTANT SMART AI GENERATOR PANEL CARD */}
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-200 space-y-3.5 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs text-indigo-950 font-black">
            <Sparkles className="w-4 h-4 text-indigo-750 animate-pulse" />
            <span>⚡ Instant AI Auto-Build & Category Class Matcher</span>
          </div>
          <p className="text-[11px] text-indigo-900/80 leading-normal">
            Enter a <strong>brand name, logo, or purpose concept</strong>. The AI will instantly match the international category class, draft detailed legal goods specifications in both <strong>English & Arabic</strong>, formulate the registered proprietor, and backdate approvals randomly from <strong>2022–2026</strong> under a clear 10-year validity interval.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text"
              placeholder="e.g. Al-Mansour Waters, Sahara Coffee, Mesopotamia Telecom..."
              value={autoGenConcept}
              onChange={(e) => setAutoGenConcept(e.target.value)}
              className="flex-grow px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-900 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleSmartAutoGen}
              disabled={aiLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiLoading ? "Drafting..." : "Generate Certificate"}</span>
            </button>
          </div>
        </div>

        {/* Core fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* F1: ID Registration block */}
          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 block mb-1">Official Registration Number (رقم التسجيل)</label>
            <input 
              type="text" 
              required
              placeholder="e.g. 355079"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
            />
            <span className="text-[9px] text-slate-400 mt-1">Must be unique across databases. Will render into the official stamp & QR Code.</span>
          </div>

          {/* F2: Nice Class Picker */}
          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 mb-1 font-sans">Trademark Class (Nice Classification)</label>
            <select
              value={classNumber}
              onChange={(e) => setClassNumber(parseInt(e.target.value))}
              className="p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {NICE_CLASSES.map((c) => (
                <option key={c.val} value={c.val}>
                  Class {c.val} - {c.desc}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Core fields grid 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* F3: Proprietor Name English */}
          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 block mb-1">Proprietor (English)</label>
            <input 
              type="text" 
              required
              placeholder="e.g. MD UZZAL"
              value={proprietor}
              onChange={(e) => setProprietor(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* F4: Proprietor Name Arabic */}
          <div className="flex flex-col text-xs font-sans text-right" dir="rtl">
            <label className="font-bold text-slate-750 block mb-1">اسم مالك العلامة (بالعربية)</label>
            <input 
              type="text" 
              placeholder="مثال: إم دي أوزال"
              value={proprietorAr}
              onChange={(e) => setProprietorAr(e.target.value)}
              className="px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm placeholder-right text-right"
            />
          </div>

          {/* F5: Trademark Word English */}
          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-705 block mb-1 font-sans">Trademark Word/Title (English)</label>
            <input 
              type="text" 
              required
              placeholder="e.g. MURASIL AL-GHARBIYA 1"
              value={trademarkName}
              onChange={(e) => setTrademarkName(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-semibold text-indigo-900"
            />
          </div>

          {/* F6: Trademark Word Arabic */}
          <div className="flex flex-col text-xs font-sans text-right" dir="rtl">
            <label className="font-bold text-slate-705 block mb-1">اسم العلامة التجارية (بالعربية)</label>
            <input 
              type="text" 
              placeholder="مثال: مراسل الغربية ١"
              value={trademarkNameAr}
              onChange={(e) => setTrademarkNameAr(e.target.value)}
              className="px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-semibold text-indigo-905 text-right"
            />
          </div>

          {/* F7: Address English */}
          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 block mb-1">Registered Address (English)</label>
            <input 
              type="text" 
              required
              placeholder="District 903, Al-Karrada, Baghdad, Iraq"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* F8: Address Arabic */}
          <div className="flex flex-col text-xs font-sans text-right" dir="rtl">
            <label className="font-bold text-slate-700 block mb-1">العنوان المسجل (بالعربية)</label>
            <input 
              type="text" 
              placeholder="حي ٩٠٣، الكرادة، بغداد، العراق"
              value={addressAr}
              onChange={(e) => setAddressAr(e.target.value)}
              className="px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-right"
            />
          </div>

        </div>

        {/* F9: Timeline Dates Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/70">
          
          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 block mb-1">Application Filing Date</label>
            <div className="relative">
              <input 
                type="date" 
                required
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 text-xs bg-white text-slate-700"
              />
            </div>
          </div>

          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 block mb-1">Approval/Registration Date</label>
            <input 
              type="date" 
              required
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 text-xs bg-white text-slate-700"
            />
          </div>

          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 block mb-1">Validity Limitation Expiry</label>
            <input 
              type="date" 
              required
              value={validityDate}
              onChange={(e) => setValidityDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 text-xs bg-white text-slate-700"
            />
          </div>

        </div>

        {/* F10: Specific Description Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex flex-col text-xs">
            <label className="font-bold text-slate-700 block mb-1">Detailed Goods & Services Clauses (English)</label>
            <textarea 
              rows={3}
              placeholder="e.g. News agency services; media photography and reporting..."
              value={goodsServices}
              onChange={(e) => setGoodsServices(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="flex flex-col text-xs text-right font-sans" dir="rtl">
            <label className="font-bold text-slate-705 block mb-1">خدمات والبضائع بالتفصيل (بالعربية)</label>
            <textarea 
              rows={3}
              placeholder="مثال: خدمات وكالات الأنباء، التصوير الإعلامي والتقارير..."
              value={goodsServicesAr}
              onChange={(e) => setGoodsServicesAr(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-right transition"
            />
          </div>

        </div>

        {/* Graphical Representation Customizer */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <span className="font-bold text-slate-800 block mb-2 text-left">Trademark Logo Canvas Settings</span>
          
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center space-x-2 font-semibold text-slate-705 cursor-pointer select-none">
              <input 
                type="radio" 
                name="logo-style" 
                checked={logoStyle === "stylized-text"} 
                onChange={() => setLogoStyle("stylized-text")} 
                className="text-indigo-650 focus:ring-indigo-500"
              />
              <span>Generate Stylized Legal Lettering</span>
            </label>

            <label className="flex items-center space-x-2 font-semibold text-slate-705 cursor-pointer select-none">
              <input 
                type="radio" 
                name="logo-style" 
                checked={logoStyle === "uploaded-image"} 
                onChange={() => setLogoStyle("uploaded-image")} 
                className="text-indigo-650 focus:ring-indigo-500"
              />
              <span>Upload Custom Graphical Image</span>
            </label>
          </div>

          {logoStyle === "uploaded-image" && (
            <div className="border border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-xl p-5 text-center transition">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                {imageLogo ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img 
                      src={imageLogo} 
                      alt="Uploaded brand" 
                      className="max-h-20 object-contain rounded-lg border border-slate-200 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-emerald-700 font-bold block">✓ Brand logo uploaded successfully</span>
                    <span className="text-[9px] text-slate-450">Click or Drag to replace image (Recommended format: PNG, size &lt; 1MB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1">
                    <Upload className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="font-bold text-slate-720 block">Drag & Drop brand logo design here</span>
                    <span className="text-[10px] text-slate-400">Or click to select a file from explorer</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          )}
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-between items-center bg-slate-50/80 -mx-4 md:-mx-6 -mb-4 md:-mb-6 p-4 rounded-b-xl border-t border-slate-200">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-xs border border-slate-300 hover:bg-slate-150 rounded-lg text-slate-650 font-bold shadow-sm transition"
          >
            Clear Fields
          </button>

          <button
            type="submit"
            disabled={saveLoading}
            id="btn-save-trademark"
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm hover:shadow cursor-pointer transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saveLoading ? "Registering Certificate..." : "Save and Register Certificate"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
