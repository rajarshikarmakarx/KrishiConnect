import React, { useRef } from 'react'
import { Printer, X, Scale, QrCode } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { numberToIndianWords } from '../../utils/numberToWords'

export default function PrintInvoiceModal({ isOpen, onClose, queueEntry, procurement, farmer }) {
  const { t, language, translateCrop, translateCentreName, translateLocation, translateDistrict, formatNumber } = useTranslation()
  const printContentRef = useRef(null)

  if (!isOpen || !queueEntry) return null

  // Fallback / Normalized Data
  const proc = procurement || {}
  const displayCrop = proc.crop || queueEntry.crop || 'Paddy'
  const displayExpectedQty = proc.expected_quantity_kg || queueEntry.expected_quantity_kg || 200
  const displayAcceptedQty = proc.accepted_quantity_kg || queueEntry.expected_quantity_kg || 200
  const displayRate = proc.rate_per_kg || 23.0
  const displayTotal = proc.total_amount || (displayAcceptedQty * displayRate)
  const isPaid = proc.payment?.status === 'PAID'

  const acceptedQuintals = (displayAcceptedQty / 100).toFixed(2)
  const ratePerQuintal = (displayRate * 100).toFixed(2)
  const amountInWords = numberToIndianWords(displayTotal, language)

  const assay = proc.assay_record || queueEntry.assay_record || {}
  const moisture = assay.moisture_percentage ?? 13.5
  const chaff = assay.chaff_percentage ?? 0.5
  const damaged = assay.damaged_grains_percentage ?? 0.0
  const grade = assay.grade || proc.grade || 'Grade A (FAQ Standard)'
  const isGradeB = grade.includes('Grade B') || grade === 'Grade B'
  const isGradeC = grade.includes('Grade C') || grade === 'Grade C'
  const baseMspRate = proc.base_rate_per_kg || (isGradeB ? Math.round((displayRate / 0.98) * 100) / 100 : isGradeC ? Math.round((displayRate / 0.90) * 100) / 100 : displayRate)
  const discountPercent = proc.discount_percentage ?? (isGradeB ? 2.0 : isGradeC ? 10.0 : 0.0)

  const receiptNo = `WB-KRC-2026-${String(queueEntry.id || 1).padStart(6, '0')}`
  const dbtRefNo = proc.payment?.id
    ? `WB-DBT-2025-${String(proc.payment.id).padStart(6, '0')}`
    : `WB-DBT-2025-${String(queueEntry.id || 1).padStart(6, '0')}`

  const completedDate = queueEntry.completed_at
    ? new Date(queueEntry.completed_at)
    : new Date()
  const formattedDateTime = completedDate.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  const farmerName = farmer?.full_name || queueEntry.farmer_name || 'Farmer Partner'
  const farmerMobile = farmer?.mobile || queueEntry.farmer_mobile || '9876543210'
  const farmerId = farmer?.farmer_id || `FARM-${farmerMobile.slice(-4)}`
  const vName = farmer?.village || queueEntry.village || 'Haripur'
  const dName = farmer?.district || queueEntry.district || 'Howrah'
  const farmerLocation = `${translateLocation(`${vName}, ${dName}`)}, ${translateDistrict('West Bengal')}`

  const handlePrint = () => {
    const invoiceEl = document.getElementById('krishi-printable-invoice')
    if (!invoiceEl) {
      window.print()
      return
    }

    // Create an isolated hidden iframe for guaranteed clean A4 printing without blank pages
    const iframe = document.createElement('iframe')
    iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;')
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow || iframe.contentDocument
    const iframeDoc = doc.document || doc

    // Extract all styles (including Tailwind compiled stylesheet)
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(tag => tag.outerHTML)
      .join('\n')

    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="${language}">
        <head>
          <meta charset="utf-8" />
          <title>${t('invoice.form_j_title')} - ${queueEntry.token}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: system-ui, -apple-system, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .printable-official-invoice {
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
              border: 2px solid #000000 !important;
              background: #ffffff !important;
              padding: 16px !important;
              margin: 0 !important;
              page-break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div style="padding: 2px;">
            ${invoiceEl.outerHTML}
          </div>
        </body>
      </html>
    `)
    iframeDoc.close()

    // Allow styles to apply, then trigger print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      } catch (err) {
        console.error('Iframe print error, falling back to window.print', err)
        window.print()
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1500)
      }
    }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container Dialog */}
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">

        {/* Modal Action Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-400/40 flex items-center justify-center text-green-300">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">{t('invoice.form_j_title')}</h3>
              <p className="text-[11px] text-slate-400">{receiptNo} · {translateCentreName(queueEntry.centre_name)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Official Invoice Body */}
        <div className="p-4 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible print:m-0" ref={printContentRef}>
          <div
            id="krishi-printable-invoice"
            className="printable-official-invoice bg-white border-2 border-slate-800 p-6 sm:p-8 text-slate-900 relative text-xs sm:text-sm font-sans leading-normal print:border-2 print:border-black print:p-5 print:m-0"
          >

            {/* Government Official Masthead */}
            <div className="text-center pb-3 border-b-2 border-slate-900 relative">
              {/* Top Insignia & Government Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-left w-24 sm:w-32">
                  <div className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold">
                    FORM 'J' (Rule 24)
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Govt of WB Gazette</p>
                </div>

                <div className="flex-1 px-2">
                  {/* Government Emblem Symbol */}
                  <div className="w-9 h-9 mx-auto mb-1 rounded-full border-2 border-green-800 flex items-center justify-center bg-green-50 text-green-900 font-bold text-base shadow-xs">
                    🏛️
                  </div>
                  <h1 className="text-sm sm:text-base font-black tracking-wider uppercase text-slate-900">
                    {t('invoice.govt_wb')}
                  </h1>
                  <h2 className="text-[11px] sm:text-xs font-extrabold text-green-900 uppercase tracking-tight">
                    {t('invoice.dept_title')}
                  </h2>
                </div>

                <div className="text-right w-24 sm:w-32">
                  <div className="inline-block px-2.5 py-1 rounded-lg bg-green-50 border border-green-300 text-green-900 font-mono font-black text-xs sm:text-sm shadow-xs">
                    {queueEntry.token}
                  </div>
                  <p className="text-[9px] text-green-800 mt-0.5 font-bold uppercase">{t('invoice.token_no')}</p>
                </div>
              </div>

              {/* Document Subtitle */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                <p className="font-black text-xs sm:text-sm tracking-wide uppercase text-slate-900">
                  {t('invoice.form_j_title')}
                </p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  {t('invoice.form_j_subtitle')}
                </p>
              </div>
            </div>

            {/* Document Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 border-b border-slate-300 text-[11px] bg-slate-50/70 -mx-6 px-6 sm:-mx-8 sm:px-8 print:-mx-5 print:px-5">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t('invoice.receipt_no')}</span>
                <span className="font-mono font-bold text-slate-900">{receiptNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t('invoice.date_time')}</span>
                <span className="font-bold text-slate-900">{formattedDateTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t('invoice.centre_name')}</span>
                <span className="font-bold text-slate-900 truncate block">{translateCentreName(queueEntry.centre_name)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t('invoice.district')}</span>
                <span className="font-bold text-slate-900">{translateDistrict(farmer?.district || queueEntry.district || 'Howrah')}, {translateDistrict('West Bengal')}</span>
              </div>
            </div>

            {/* Section 1: Farmer Particulars */}
            <div className="py-2.5 border-b border-slate-300">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span>1. {t('invoice.farmer_section_title')}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">{t('invoice.farmer_name')}</span>
                  <span className="font-bold text-slate-900">{farmerName}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">{t('invoice.farmer_id')}</span>
                  <span className="font-mono font-bold text-slate-900">{farmerId}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">{t('invoice.mobile')}</span>
                  <span className="font-mono font-semibold text-slate-800">{farmerMobile}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">{t('invoice.location')}</span>
                  <span className="font-medium text-slate-800 truncate block">{farmerLocation}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Certified Agmark Assaying & Quality Report */}
            <div className="py-2.5 border-b border-slate-300">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700">
                  2. {t('invoice.assay_section_title')}
                </h4>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px]">
                  ✓ {grade}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{t('invoice.moisture_observed')}</p>
                  <p className="text-sm font-black text-slate-900 my-0.5">{formatNumber(moisture)}%</p>
                  <p className="text-[9px] text-slate-500">{t('invoice.moisture_limit')}</p>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{t('invoice.chaff_observed')}</p>
                  <p className="text-sm font-black text-slate-900 my-0.5">{formatNumber(chaff)}%</p>
                  <p className="text-[9px] text-slate-500">{t('invoice.chaff_limit')}</p>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{t('invoice.damaged_observed')}</p>
                  <p className="text-sm font-black text-slate-900 my-0.5">{formatNumber(damaged)}%</p>
                  <p className="text-[9px] text-slate-500">{t('invoice.damaged_limit')}</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 mt-1 text-center italic">
                ✓ {t('invoice.assay_verified')} · Agmark Certificate ID: AG-{receiptNo.slice(-6)}
              </p>
            </div>

            {/* Section 3: Financial Valuation & Weighment Table */}
            <div className="py-2.5 border-b-2 border-slate-900">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 mb-1.5">
                3. {t('invoice.financial_title')}
              </h4>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-1.5 border-r border-slate-300 text-center w-10">{t('invoice.sno')}</th>
                      <th className="p-1.5 border-r border-slate-300 text-left">{t('invoice.item_description')}</th>
                      <th className="p-1.5 border-r border-slate-300 text-right w-24">{t('invoice.expected_qty')}</th>
                      <th className="p-1.5 border-r border-slate-300 text-right w-28">{t('invoice.accepted_weight')}</th>
                      <th className="p-1.5 border-r border-slate-300 text-right w-28">{t('invoice.statutory_rate')}</th>
                      <th className="p-1.5 text-right w-28">{t('invoice.total_amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 font-medium">
                      <td className="p-1.5 border-r border-slate-300 text-center">1</td>
                      <td className="p-1.5 border-r border-slate-300">
                        <span className="font-bold text-slate-900">{translateCrop(displayCrop)}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Kharif Season 2025-26 · {grade}
                          {discountPercent > 0 && ` (${discountPercent}% Statutory Value Cut)`}
                        </span>
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-right text-slate-600">
                        {formatNumber(displayExpectedQty)} {t('invoice.unit_kg')}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-right font-bold text-slate-900">
                        {formatNumber(displayAcceptedQty)} {t('invoice.unit_kg')}
                        <span className="text-[10px] text-slate-500 block font-normal">({formatNumber(acceptedQuintals)} {t('invoice.unit_quintal')})</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-right text-slate-900 font-semibold">
                        ₹{formatNumber(displayRate.toFixed(2))}/kg
                        <span className="text-[10px] text-slate-500 block font-normal">₹{formatNumber(ratePerQuintal)}/qtl</span>
                        {discountPercent > 0 && (
                          <span className="text-[9px] text-blue-700 block font-semibold">
                            (Base: ₹{formatNumber(baseMspRate.toFixed(2))} -{discountPercent}%)
                          </span>
                        )}
                      </td>
                      <td className="p-1.5 text-right font-black text-slate-900 text-sm">
                        ₹{formatNumber(displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }))}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td colSpan={5} className="p-1.5 text-right border-r border-slate-300 font-extrabold text-slate-800">
                        {t('invoice.total_amount')} (INR):
                      </td>
                      <td className="p-1.5 text-right font-black text-green-900 text-base">
                        ₹{formatNumber(displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="mt-1.5 p-1.5 bg-slate-50 rounded border border-slate-200 text-xs flex items-start gap-2">
                <span className="font-bold text-slate-700 shrink-0">{t('invoice.amount_in_words')}:</span>
                <span className="font-bold text-slate-900 italic">{amountInWords}</span>
              </div>
            </div>

            {/* Section 4: Direct Benefit Transfer (DBT) & Treasury Settlement */}
            <div className="py-2.5 border-b border-slate-300">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 mb-1.5">
                4. {t('invoice.dbt_section_title')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">{t('invoice.dbt_ref_no')}</span>
                  <span className="font-mono font-bold text-slate-900">{dbtRefNo}</span>
                </div>
                <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">{t('invoice.payment_status')}</span>
                  <span className={`font-bold text-[11px] block ${isPaid ? 'text-green-800' : 'text-amber-800'}`}>
                    {isPaid ? `✓ ${t('invoice.status_paid')}` : `⏳ ${t('invoice.status_processing')}`}
                  </span>
                </div>
                <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">{t('invoice.disbursement_channel')}</span>
                  <span className="font-medium text-slate-800 text-[11px] block">{t('invoice.disbursement_channel_val')}</span>
                </div>
              </div>
            </div>

            {/* Section 5: Security QR & Authorized Signatures */}
            <div className="pt-3 mt-1">
              <div className="grid grid-cols-4 gap-3 items-end text-center">

                {/* QR Code Matrix */}
                <div className="text-center flex flex-col items-center justify-center p-1.5 rounded border border-slate-200 bg-slate-50">
                  <div className="w-14 h-14 bg-white p-1 rounded border border-slate-300 flex items-center justify-center shadow-xs">
                    <QrCode className="w-12 h-12 text-slate-900" />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 mt-1 block">VERIFIED #KRC-{receiptNo.slice(-4)}</span>
                </div>

                {/* Farmer Signature */}
                <div className="text-center">
                  <div className="h-9 border-b border-slate-400 mb-1 flex items-end justify-center">
                    <span className="text-[10px] font-mono text-slate-400 italic">Digitally Acknowledged</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">{t('invoice.farmer_signature')}</p>
                </div>

                {/* Operator Signature */}
                <div className="text-center">
                  <div className="h-9 border-b border-slate-400 mb-1 flex items-end justify-center">
                    <span className="text-[10px] font-mono text-green-800 font-bold">✓ KrishiConnect Assayed</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">{t('invoice.operator_signature')}</p>
                </div>

                {/* Procurement Officer Seal */}
                <div className="text-center">
                  <div className="h-9 border-b border-slate-400 mb-1 flex items-end justify-center">
                    <div className="inline-block px-1.5 py-0.5 rounded border border-green-700 bg-green-50 text-[9px] font-bold text-green-900">
                      APPROVED WB-F&S
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">{t('invoice.officer_signature')}</p>
                </div>

              </div>

              {/* Legal Disclaimer Footer */}
              <div className="mt-3 pt-2 border-t border-slate-300 text-center text-[9px] text-slate-500 leading-tight">
                <p>{t('invoice.legal_disclaimer')}</p>
                <p className="mt-0.5 font-mono">KRISHICONNECT DIGITAL PUBLIC INFRASTRUCTURE · STATUTORY MSP PROTECTION ASSURED</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer (Hidden on Print) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0 print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            💡 {t('invoice.legal_disclaimer')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer"
            >
              {t('invoice.close_btn')}
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{t('invoice.print_invoice_btn')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
