/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { TrademarkRecord } from "../types";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Printer, MapPin, Hash, PackageOpen } from "lucide-react";

interface TrademarkCertificateProps {
  record: TrademarkRecord;
  onPrint?: () => void;
}

export default function TrademarkCertificate({ record, onPrint }: TrademarkCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  // Generates verification URL for the QR code
  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}?verifyId=${record.id}`
    : `https://iraqtrademarkdatabase.gov.iq/verify/${record.id}`;

  const handleLocalPrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      try {
        if (typeof window !== "undefined" && typeof window.print === "function") {
          window.print();
        } else {
          console.warn("Print function not available in this window environment.");
        }
      } catch (err) {
        console.warn("Failed to invoke window.print due to environment sandbox restrictions:", err);
      }
    }
  };

  // Simple SVG Barcode generator to look highly realistic
  const renderBarcode = (text: string) => {
    const bars = [];
    let seed = 12345;
    const l = text.length;
    for (let i = 0; i < 35; i++) {
      // Semi-random deterministic width
      seed = (seed * 9301 + 49297) % 233280;
      const width = (seed % 3) + 1;
      const isBlack = seed % 2 === 0;
      bars.push(
        <rect 
          key={i} 
          x={i * 3} 
          y="0" 
          width={width} 
          height="14" 
          fill={isBlack ? "#1e293b" : "transparent"} 
        />
      );
    }
    return (
      <div className="flex flex-col items-center select-none opacity-85">
        <svg width="105" height="14" className="mb-0.5">
          {bars}
        </svg>
        <span className="text-[7.5px] font-mono tracking-widest text-slate-500 font-bold">
          *IRQ-ID-{text}*
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Dynamic Print Stylesheet Injected Directly to Prevent Parent Elements / AI Studio Header leaks */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Force page margins to be clean */
          @page {
            size: A4 landscape;
            margin: 0 !important;
          }
          
          /* Hide all screen elements on the page completely */
          body * {
            visibility: hidden !important;
          }
          
          /* Exclude everything except the official certificate sheet container and its elements */
          #arabic-certificate-sheet, #arabic-certificate-sheet * {
            visibility: visible !important;
          }
          
          #arabic-certificate-sheet {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important; /* Standard A4 landscape dimensions */
            height: 210mm !important;
            margin: 0 !important;
            padding: 14mm !important; /* Exquisite margins */
            box-sizing: border-box !important;
            border: 14px double #1e293b !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
          }
          
          /* Preserve SVG graphics and color styles when printing */
          svg, img, rect, path, circle {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      ` }} />

      {/* Printable Area Wrapper - Elegant Parchment-Styled Government Deed */}
      <div 
        ref={certificateRef}
        id="arabic-certificate-sheet"
        className="relative w-full max-w-4xl p-10 md:p-14 my-6 bg-amber-50/[0.12] bg-[radial-gradient(#fdfbf7_1px,transparent_1px)] [background-size:16px_16px] border-[14px] border-double border-slate-900 shadow-2xl rounded-none text-slate-900 overflow-hidden font-serif select-none"
        style={{ backgroundColor: "#fcfbf7" }}
      >
        {/* Fine-line elegant interior accent border */}
        <div className="absolute inset-2 border border-slate-400 pointer-events-none"></div>
        <div className="absolute inset-3.5 border border-slate-200 pointer-events-none"></div>
        
        {/* Security Microtext lines repeating on sides */}
        <div className="absolute top-2.5 left-8 right-8 text-[6px] font-sans font-bold tracking-widest text-slate-350 select-none text-center pointer-events-none">
          REPUBLIC OF IRAQ MINISTRY OF TRADE DIRECTORATE OF INDUSTRIAL PROPERTY REGISTRATION • REPUBLIC OF IRAQ MINISTRY OF TRADE DIRECTORATE OF INDUSTRIAL PROPERTY REGISTRATION
        </div>
        <div className="absolute bottom-2.5 left-8 right-8 text-[6px] font-sans font-bold tracking-widest text-slate-350 select-none text-center pointer-events-none">
          REPUBLIC OF IRAQ MINISTRY OF TRADE DIRECTORATE OF INDUSTRIAL PROPERTY REGISTRATION • REPUBLIC OF IRAQ MINISTRY OF TRADE DIRECTORATE OF INDUSTRIAL PROPERTY REGISTRATION
        </div>

        {/* Traditional Ornate Corner Decorations */}
        <div className="absolute top-4 left-4 text-slate-400 text-lg select-none pointer-events-none">⚜</div>
        <div className="absolute top-4 right-4 text-slate-400 text-lg select-none pointer-events-none">⚜</div>
        <div className="absolute bottom-4 left-4 text-slate-400 text-lg select-none pointer-events-none">⚜</div>
        <div className="absolute bottom-4 right-4 text-slate-400 text-lg select-none pointer-events-none">⚜</div>

        {/* 1. FAINT EAGLE OF SALADIN SECURITY WATERMARK (Background Layer) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
          <svg viewBox="0 0 100 100" className="w-[420px] h-[420px] text-slate-800">
            <path 
              fill="currentColor" 
              d="M 50,12 C 48,15 45,20 44,25 C 41,24 37,22 34,20 C 35,26 37,32 39,37 C 33,37 27,35 22,33 C 24,40 28,47 33,52 C 26,54 18,53 10,50 C 13,58 20,65 28,68 C 22,72 15,74 8,75 L 32,80 Q 28,84 15,88 C 24,91 33,90 41,85 C 41,88 40,92 38,95 L 43,95 L 46,90 L 50,92 L 54,90 L 57,95 L 62,95 C 60,92 59,88 59,85 C 67,90 76,91 85,88 C 78,87 72,84 68,80 C 77,82 85,80 92,75 C 85,74 78,72 72,68 C 80,65 87,58 90,50 C 82,53 74,54 67,52 C 72,47 76,40 78,33 C 73,35 67,37 61,37 C 63,32 65,26 66,20 C 63,22 59,24 56,25 C 55,20 52,15 50,12 Z" 
            />
            <rect x="42" y="32" width="16" height="24" rx="1" fill="#FFF" stroke="#111" strokeWidth="1" />
          </svg>
        </div>

        {/* MAIN CERTIFICATE FRAME CONTENT (Elevated relative to watermark) */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          
          {/* Bilingual Header Layout */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-slate-350 pb-4 mb-4">
            
            {/* Left: English Header (USPTO style font pairings) */}
            <div className="text-left md:w-1/3 mb-2 md:mb-0 space-y-0.5">
              <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 font-serif">Republic of Iraq</h2>
              <h3 className="text-[11px] font-bold text-slate-800">Ministry of Trade</h3>
              <p className="text-[9.5px] text-slate-500 font-sans font-medium">Directorate of Industrial Property Registration</p>
              <p className="text-[8.5px] text-slate-400 font-mono tracking-wider">National Trademark Central Ledger</p>
            </div>

            {/* Center: Iraqi National Emblem (Extremely refined, official look) */}
            <div className="flex flex-col items-center justify-center md:w-1/3 mb-2 md:mb-0">
              <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-300 p-1 shadow-sm">
                <svg viewBox="0 0 100 100" className="w-11 h-11 text-slate-850">
                  {/* Detailed Eagle of Saladin Silhouette and Wings */}
                  <path 
                    fill="#1e293b" 
                    d="M 50,12 C 48,15 45,20 44,25 C 41,24 37,22 34,20 C 35,26 37,32 39,37 C 33,37 27,35 22,33 C 24,40 28,47 33,52 C 26,54 18,53 10,50 C 13,58 20,65 28,68 C 22,72 15,74 8,75 L 32,80 Q 28,84 15,88 C 24,91 33,90 41,85 C 41,88 40,92 38,95 L 43,95 L 46,90 L 50,92 L 54,90 L 57,95 L 62,95 C 60,92 59,88 59,85 C 67,90 76,91 85,88 C 78,87 72,84 68,80 C 77,82 85,80 92,75 C 85,74 78,72 72,68 C 80,65 87,58 90,50 C 82,53 74,54 67,52 C 72,47 76,40 78,33 C 73,35 67,37 61,37 C 63,32 65,26 66,20 C 63,22 59,24 56,25 C 55,20 52,15 50,12 Z" 
                  />
                  <rect x="42" y="32" width="16" height="24" rx="1" fill="#FFF" stroke="#111827" strokeWidth="0.8" />
                  <rect x="42" y="32" width="16" height="8" fill="#e11d48" />
                  <rect x="42" y="48" width="16" height="8" fill="#111827" />
                  <text x="50" y="44.5" fill="#15803d" fontSize="4.1" fontWeight="bold" textAnchor="middle" className="font-sans font-bold select-none">الله أكبر</text>
                  <rect x="30" y="82" width="40" height="4.5" fill="#1e293b" rx="0.5" />
                  <text x="50" y="85.5" fill="#ffffff" fontSize="2.8" fontWeight="bold" textAnchor="middle" className="font-sans font-bold">REPUBLIC OF IRAQ</text>
                </svg>
              </div>
              <span className="text-[7.5px] text-slate-500 tracking-wider uppercase mt-1.5 font-sans font-bold">
                OFFICIAL REGISTER DEED
              </span>
            </div>

            {/* Right: Arabic Header & Barcode tracking */}
            <div className="text-right md:w-1/3 flex flex-col items-end space-y-1" dir="rtl">
              <div>
                <h2 className="text-xs font-black text-slate-900">جمهورية العراق</h2>
                <h3 className="text-[11px] font-bold text-slate-800">وزارة التجارة</h3>
                <p className="text-[9.5px] text-slate-500 font-sans font-medium">دائرة تسجيل الملكية الصناعية وبراءات الاختراع</p>
                <p className="text-[8.5px] text-slate-400 font-mono tracking-wider mt-0.5">سجل العلامات الوطني المركزي</p>
              </div>
              
              {/* Barcode representation */}
              <div className="pt-1.5">
                {renderBarcode(record.id)}
              </div>
            </div>

          </div>

          {/* Certificate Title in Authentic USPTO Typography */}
          <div className="text-center mb-4 mt-1 space-y-1">
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-slate-950 uppercase font-serif">
              Trademark Registration Certificate
            </h1>
            <h1 className="text-md md:text-lg font-black text-slate-800 tracking-wide font-serif" dir="rtl">
              شهادة تسجيل علامة تجارية وطنية رسمية
            </h1>
            <div className="w-40 h-[1.5px] bg-slate-450 mx-auto my-1" />
            <p className="text-[10px] text-slate-600 leading-relaxed italic max-w-2xl mx-auto">
              This certifies that the trademark representation shown below has been formally registered in the central federal ledger with the Industrial Property Directorate pursuant to Trademark & Industrial Indications Law No. 21 of 1957.
            </p>
          </div>

          {/* Core Trademark Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2 pb-4 border-b border-slate-200">
            
            {/* Left Content Area (7/12 Columns) */}
            <div className="md:col-span-7 flex flex-col space-y-3">
              
              {/* Certificate ID Row */}
              <div className="flex justify-between items-center p-2 bg-slate-100/80 border border-slate-300">
                <div className="flex items-center space-x-1.5 text-[11.5px] text-slate-800">
                  <Hash className="w-4 h-4 text-slate-900 shrink-0" />
                  <span className="font-bold uppercase tracking-wider">Registration Number:</span>
                  <span className="font-mono font-black text-slate-950 text-xs ml-1">{record.id}</span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-slate-850 font-sans font-bold" dir="rtl">
                  <span>رقم التسجيل المركزي:</span>
                  <span className="font-mono font-black text-slate-950">
                    {record.id.split('').map(char => '٠١٢٣٤٥٦٧٨٩'[parseInt(char)] || char).join('')}
                  </span>
                </div>
              </div>

              {/* Proprietor Details */}
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-150 pb-2.5">
                <div className="pr-2 border-r border-slate-250 text-left">
                  <span className="text-[9.5px] uppercase tracking-wider text-slate-450 font-sans font-black">Proprietor Name</span>
                  <p className="font-black text-slate-900 text-[11.5px] mt-0.5 leading-tight">{record.proprietor}</p>
                </div>
                <div className="pl-2 text-right" dir="rtl">
                  <span className="text-[9.5px] text-slate-455 font-sans font-black">اسم مالك العلامة التجاري</span>
                  <p className="font-black text-slate-900 text-[11.5px] mt-0.5 leading-tight">{record.proprietorAr}</p>
                </div>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-150 pb-2.5">
                <div className="pr-2 border-r border-slate-250 text-left flex items-start space-x-1">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9.5px] uppercase tracking-wider text-slate-450 font-sans font-black">Registered Address</span>
                    <p className="text-slate-800 text-[10.5px] mt-0.5 leading-tight">{record.address}</p>
                  </div>
                </div>
                <div className="pl-2 text-right" dir="rtl">
                  <span className="text-[9.5px] text-slate-455 font-sans font-black">العنوان القانوني المسجل للشركة</span>
                  <p className="text-slate-800 text-[10.5px] mt-0.5 leading-tight">{record.addressAr}</p>
                </div>
              </div>

              {/* Nice Class Designation */}
              <div className="flex justify-between items-center p-2 bg-slate-100/60 border border-slate-250">
                <div className="flex items-center space-x-1.5 text-[11.5px] text-slate-800">
                  <PackageOpen className="w-4 h-4 text-slate-900 shrink-0" />
                  <span className="font-bold uppercase tracking-wider">Nice Classification Code:</span>
                  <span className="font-mono font-black text-slate-950 bg-white border border-slate-350 px-2 py-0.5 text-xs ml-1 rounded">
                    Class {record.classNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-850 font-sans font-bold" dir="rtl">
                  تصنيف نيس الدولي المعتمد: <span className="font-mono text-slate-950 ml-1 font-black">{record.classNumber}</span>
                </div>
              </div>

              {/* Goods Specification Detail */}
              <div className="grid grid-cols-1 p-2 bg-slate-50/50 border border-slate-200 text-[10px] space-y-1">
                <div className="text-left border-b border-slate-200 pb-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-450 font-sans font-black">
                    Class Specification of Goods / Services (EN)
                  </span>
                  <p className="text-slate-800 leading-relaxed font-sans text-[9.5px] mt-0.5 max-h-20 overflow-y-auto pr-1">
                    {record.goodsServices}
                  </p>
                </div>
                <div className="text-right pt-1" dir="rtl">
                  <span className="text-[9px] text-slate-455 font-sans font-black">
                    بيان المنتجات أو الخدمات المشمولة بسند القيد القانوني (AR)
                  </span>
                  <p className="text-slate-800 leading-relaxed font-sans text-[9.5px] mt-0.5 max-h-20 overflow-y-auto pl-1">
                    {record.goodsServicesAr}
                  </p>
                </div>
              </div>

            </div>

            {/* Right Graphical Area (5/12 Columns) */}
            <div className="md:col-span-5 flex flex-col items-center justify-between space-y-4 md:border-l border-slate-200 md:pl-4">
              
              {/* Trademark Vector/Image representation frame */}
              <div className="w-full flex flex-col items-center">
                <span className="text-[9.5px] uppercase tracking-wider text-slate-450 font-sans font-black mb-1">
                  Visual Design Block / العلامة المسجلة
                </span>
                <div className="w-full h-32 border border-slate-350 bg-white rounded-none flex items-center justify-center p-3 relative shadow-sm">
                  {record.logoStyle === "uploaded-image" && record.imageLogo ? (
                    <img 
                      src={record.imageLogo} 
                      alt="Trademark representation logo" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center flex flex-col items-center justify-center p-1 font-serif select-none">
                      <span className="text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                        {record.trademarkName}
                      </span>
                      <span className="text-xs font-bold text-slate-850 mt-1 block font-serif" dir="rtl">
                        {record.trademarkNameAr}
                      </span>
                      <div className="absolute bottom-1 right-1 text-[7px] font-sans text-slate-400 font-bold tracking-widest uppercase">
                        [WORDMARK STANDARD]
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Verification Hub */}
              <div className="w-full bg-slate-100/80 p-2.5 border border-slate-250 flex items-center space-x-3 rounded-none">
                <div className="flex-shrink-0 bg-white p-1 border border-slate-300">
                  <QRCodeSVG 
                    value={verificationUrl}
                    size={68}
                    level="H"
                    includeMargin={false}
                    fgColor="#0f172a"
                  />
                </div>
                <div className="flex-col text-left">
                  <div className="flex items-center text-[9.5px] font-black text-slate-900 font-sans space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
                    <span>REGISTRY LEDGER VERIFICATION</span>
                  </div>
                  <p className="text-[8px] text-slate-500 leading-normal font-sans mt-0.5">
                    Scan this secure code with any camera device to authenticate current registration state.
                  </p>
                  <p className="text-[8px] text-indigo-800 font-black font-sans mt-0.5" dir="rtl">
                    امسح للتأكد الفوري من القيد الفيدرالي
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Protection Timeline Overview */}
          <div className="grid grid-cols-4 gap-2 mt-3 py-2 bg-slate-100/70 border border-slate-250 text-center text-xs">
            <div>
              <span className="font-bold text-slate-900 block text-[9px] uppercase font-sans tracking-wide">Filing Date</span>
              <span className="font-semibold text-slate-950 font-mono block text-[10.5px] mt-0.5">{record.applicationDate}</span>
              <span className="text-[8px] text-slate-450 block" dir="rtl">تاريخ إيداع الطلب</span>
            </div>
            <div className="border-l border-slate-250">
              <span className="font-bold text-slate-900 block text-[9px] uppercase font-sans tracking-wide">Registration Date</span>
              <span className="font-semibold text-slate-950 font-mono block text-[10.5px] mt-0.5">{record.registrationDate}</span>
              <span className="text-[8px] text-slate-450 block" dir="rtl">تاريخ منح السند</span>
            </div>
            <div className="border-l border-slate-250">
              <span className="font-bold text-slate-900 block text-[9px] uppercase font-sans tracking-wide">Date of Expiration</span>
              <span className={`font-mono font-bold block text-[10.5px] mt-0.5 ${record.status === 'expired' ? 'text-red-700' : 'text-slate-950'}`}>
                {record.validityDate}
              </span>
              <span className="text-[8px] text-slate-450 block" dir="rtl">تاريخ انتهاء الصلاحية</span>
            </div>
            <div className="border-l border-slate-250">
              <span className="font-bold text-slate-900 block text-[9px] uppercase font-sans tracking-wide">Federal Status</span>
              <span className={`font-sans font-black block text-[10.5px] mt-0.5 uppercase ${record.status === 'expired' ? 'text-red-700' : 'text-emerald-700'}`}>
                {record.status === 'expired' ? 'Expired / منتهي' : 'Active / ساري الحماية'}
              </span>
              <span className="text-[8.5px] text-slate-400 block">Ministry Defended</span>
            </div>
          </div>

          {/* 2. DUAL LEGAL REGISTRAR SIGNATURES & BLENDED WET INK STAMPS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 pt-3 items-center relative">
            
            {/* Left Legal Text (5/12) */}
            <div className="md:col-span-5 text-slate-500 text-[8.5px] leading-relaxed space-y-1 select-none pr-2">
              <p>
                <strong>IN TESTIMONY WHEREOF,</strong> this official deed of trademark registration is issued under the seal and authority of the Directorate of Industrial Property Registration, Ministry of Trade, Republic of Iraq. Protection is granted for a statutory 10-year term from filing, renewable for successive periods in accordance with central federal legislation.
              </p>
              <p dir="rtl" className="text-right leading-relaxed text-slate-450">
                <strong>وإثباتاً لما تقدم،</strong> أصدرت هذه الوثيقة الرسمية ممهورة بختم دائرة تسجيل الملكية الصناعية وبراءات الاختراع، وزارة التجارة، جمهورية العراق. تُمنح الحماية القانونية للعلامة لمدة ١٠ سنوات متتالية قابلة للتجديد وفق القوانين الاتحادية.
              </p>
            </div>

            {/* Right Signatures & stamps (7/12) - Beautiful overlapping wet stamps */}
            <div className="md:col-span-7 flex justify-end items-center gap-10 pr-4 select-none relative">
              
              {/* Signature 1: General Registrar (Red Ink Stamp Overlaid) */}
              <div className="text-center relative w-36">
                
                {/* Red Ink Stamp Graphic overlay */}
                <div className="absolute -top-10 left-3 pointer-events-none select-none opacity-[0.82] mix-blend-multiply z-20">
                  <svg width="84" height="84" viewBox="0 0 100 100" className="text-rose-600/90 font-sans">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="3 1" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="0.8" />
                    <text x="50" y="22" fill="currentColor" fontSize="6" fontWeight="black" textAnchor="middle" letterSpacing="0.3">★ MINISTRY OF TRADE ★</text>
                    <text x="50" y="82" fill="currentColor" fontSize="5.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.1">REGISTRAR GENERAL</text>
                    <path d="M 18,50 Q 50,42 82,50" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <text x="50" y="47" fill="currentColor" fontSize="8" fontWeight="black" textAnchor="middle">APPROVED</text>
                    <text x="50" y="59" fill="#e11d48" fontSize="4.2" fontWeight="bold" textAnchor="middle" dir="rtl">وزارة التجارة - المسجل</text>
                  </svg>
                </div>

                {/* Hand Signature Cursive Ink */}
                <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none select-none z-10">
                  <svg viewBox="0 0 110 32" className="w-24 h-11 opacity-90">
                    <path 
                      d="M 10,24 C 20,4 30,34 34,22 C 38,10 42,-4 48,16 C 54,30 58,6 62,18 C 68,30 72,12 76,16 C 80,20 90,4 86,12 C 78,26 62,30 74,16" 
                      fill="none" 
                      stroke="#1e3a8a" 
                      strokeWidth="1.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <path 
                      d="M 6,28 Q 36,32 98,22" 
                      fill="none" 
                      stroke="#1e3a8a" 
                      strokeWidth="1.2" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>

                <div className="border-t border-slate-350 pt-1 mt-6 relative z-0">
                  <span className="block font-sans text-[9px] font-black text-slate-800">A. Al-Hamdani</span>
                  <span className="block text-[7.5px] text-slate-500 font-sans font-bold uppercase leading-none">Registrar General</span>
                  <span className="block text-[7px] text-slate-400 font-sans font-medium mt-0.5" dir="rtl">مسجل العلامات العام</span>
                </div>
              </div>

              {/* Signature 2: Director of Intellectual Property (Blue Ink Stamp Overlaid) */}
              <div className="text-center relative w-36">
                
                {/* Blue Ink Stamp Graphic overlay */}
                <div className="absolute -top-11 -left-1 pointer-events-none select-none opacity-[0.80] mix-blend-multiply z-20">
                  <svg width="86" height="86" viewBox="0 0 100 100" className="text-blue-600/90 font-sans">
                    <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
                    <text x="50" y="24" fill="currentColor" fontSize="5.5" fontWeight="black" textAnchor="middle">★ REPUBLIC OF IRAQ ★</text>
                    <text x="50" y="80" fill="currentColor" fontSize="5" fontWeight="bold" textAnchor="middle">DIRECTOR OF INDUSTRIAL PROPERTY</text>
                    <text x="50" y="44" fill="currentColor" fontSize="7" fontWeight="black" textAnchor="middle">RECORDED</text>
                    <text x="50" y="56" fill="currentColor" fontSize="5" fontWeight="black" textAnchor="middle" dir="rtl">الملكية الصناعية - التسجيل</text>
                    <path d="M 22,48 L 78,48" stroke="currentColor" strokeWidth="0.8" />
                  </svg>
                </div>

                {/* Hand Signature Cursive Ink */}
                <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none select-none z-10">
                  <svg viewBox="0 0 110 32" className="w-24 h-11 opacity-90">
                    <path 
                      d="M 15,14 Q 35,2 45,26 T 65,10 T 85,24" 
                      fill="none" 
                      stroke="#0f172a" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <path 
                      d="M 12,20 Q 52,4 96,16" 
                      fill="none" 
                      stroke="#0f172a" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>

                <div className="border-t border-slate-350 pt-1 mt-6 relative z-0">
                  <span className="block font-sans text-[9px] font-black text-slate-800">M. Qasim Jamil</span>
                  <span className="block text-[7.5px] text-slate-500 font-sans font-bold uppercase leading-none">Director General IPD</span>
                  <span className="block text-[7px] text-slate-400 font-sans font-medium mt-0.5" dir="rtl">مدير الملكية الصناعية</span>
                </div>
              </div>

              {/* 3. GILDED SCALLOPED GOLD FOIL MEDALLION (Central Certificate Seal) */}
              <div className="absolute right-[330px] -top-14 pointer-events-none select-none z-10 shrink-0 hidden lg:block">
                <div className="relative">
                  {/* Scalloped Gold Medallion vector */}
                  <svg width="85" height="115" viewBox="0 0 100 135" className="filter drop-shadow-md">
                    {/* Hanging red ribbons */}
                    <path d="M 32,55 L 24,130 L 45,115 L 42,55 Z" fill="#b91c1c" opacity="0.9" />
                    <path d="M 68,55 L 76,130 L 55,115 L 58,55 Z" fill="#991b1b" opacity="0.9" />
                    
                    {/* Gold medallion base */}
                    <circle cx="50" cy="50" r="44" fill="url(#gold-gradient-medallion)" stroke="#d97706" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 1.5" />
                    <circle cx="50" cy="50" r="34" fill="none" stroke="#d97706" strokeWidth="1.5" />
                    
                    {/* Inner design (Iraq map or stars or crown) */}
                    <path d="M 50,26 L 53,35 L 62,35 L 55,41 L 57,50 L 50,44 L 43,50 L 45,41 L 38,35 L 47,35 Z" fill="#b45309" />
                    <circle cx="50" cy="50" r="26" fill="none" stroke="#92400e" strokeWidth="0.8" />
                    
                    <text x="50" y="62" fill="#78350f" fontSize="4.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.2">MINISTRY</text>
                    <text x="50" y="67" fill="#78350f" fontSize="4.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.2">OF TRADE</text>
                    
                    {/* Star patterns */}
                    <circle cx="50" cy="50" r="18" fill="none" stroke="#b45309" strokeWidth="0.5" strokeDasharray="2 3" />
                    
                    {/* Definitions of shiny golden gradients */}
                    <defs>
                      <linearGradient id="gold-gradient-medallion" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="30%" stopColor="#fbbf24" />
                        <stop offset="65%" stopColor="#d97706" />
                        <stop offset="85%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Screen-only utility button */}
      <div className="mt-4 flex flex-wrap gap-3 items-center justify-center print:hidden">
        <button 
          onClick={handleLocalPrint}
          id="btn-print-certificate"
          className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-none shadow-md transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Download / Print Official Deed (تحميل وطباعة شهادة القيد)</span>
        </button>
        <div className="text-xs text-slate-500 max-w-sm text-center font-sans">
          Generates a certified high-security A4 Landscape ledger printout. Automatically isolates and excludes the dev frame, navigation tabs, scroll bars, and window headers.
        </div>
      </div>
    </div>
  );
}
