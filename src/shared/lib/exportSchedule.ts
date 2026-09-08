/**
 * Schedule export utilities — generates Excel (.xlsx) and PDF files
 * entirely client-side. No backend endpoints needed.
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CalendarEvent } from '@/features/staff/generateCalendarEvents'

/* ── Types ────────────────────────────────────────────────────────────────── */

export type ExportFormat = 'excel' | 'pdf'
export type ExportScope = 'all' | 'single'

export interface ExportOptions {
  format: ExportFormat
  scope: ExportScope
  staffId?: string
  staffName?: string
  dateRangeLabel: string
  filename: string
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function buildRows(events: CalendarEvent[], scope: ExportScope, staffId?: string) {
  const filtered = scope === 'single' && staffId
    ? events.filter((e) => e.staffId === staffId && !e.isCancelled)
    : events.filter((e) => !e.isCancelled)

  const sorted = [...filtered].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (a.staffName !== b.staffName) return a.staffName.localeCompare(b.staffName)
    return a.start.localeCompare(b.start)
  })

  return sorted.map((e) => ({
    date: formatDateDisplay(e.date),
    day: getDayDisplay(e.date),
    staff: e.staffName,
    role: e.staffRole || '—',
    start: e.start,
    end: e.end,
    duration: calcDuration(e.start, e.end),
    source: e.source === 'shift' ? 'Assigned' : e.source === 'override' ? 'Override' : 'Template',
    status: e.shiftStatus || '—',
  }))
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDayDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short' })
}

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMin = (eh * 60 + em) - (sh * 60 + sm)
  if (totalMin <= 0) return '—'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ── Excel Export ─────────────────────────────────────────────────────────── */

export function exportToExcel(events: CalendarEvent[], options: ExportOptions) {
  const rows = buildRows(events, options.scope, options.staffId)

  const staffGroups = new Map<string, typeof rows>()
  for (const row of rows) {
    const existing = staffGroups.get(row.staff)
    if (existing) existing.push(row)
    else staffGroups.set(row.staff, [row])
  }

  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = rows.map((r) => ({
    'Date': r.date,
    'Day': r.day,
    'Staff': r.staff,
    'Role': r.role,
    'Start': r.start,
    'End': r.end,
    'Duration': r.duration,
    'Source': r.source,
    'Status': r.status,
  }))
  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  summaryWs['!cols'] = [
    { wch: 14 }, { wch: 6 }, { wch: 20 }, { wch: 15 },
    { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Schedule')

  // Per-staff sheets (when exporting all)
  if (options.scope === 'all' && staffGroups.size > 1) {
    for (const [staffName, staffRows] of staffGroups) {
      const sheetName = staffName.substring(0, 31).replace(/[\\/?*[\]]/g, '')
      const data = staffRows.map((r) => ({
        'Date': r.date, 'Day': r.day, 'Start': r.start, 'End': r.end,
        'Duration': r.duration, 'Source': r.source, 'Status': r.status,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = [
        { wch: 14 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      ]
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `${options.filename}.xlsx`)
}

/* ── PDF Export ───────────────────────────────────────────────────────────── */

export function exportToPDF(events: CalendarEvent[], options: ExportOptions) {
  const rows = buildRows(events, options.scope, options.staffId)
  const doc = new jsPDF({ orientation: rows.length > 30 ? 'landscape' : 'portrait' })

  // Title
  doc.setFontSize(16)
  doc.text('Team Schedule', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(options.dateRangeLabel, 14, 28)
  if (options.scope === 'single' && options.staffName) {
    doc.text(`Staff: ${options.staffName}`, 14, 34)
  }
  doc.setTextColor(0)

  // Stats
  const totalShifts = rows.length
  const uniqueStaff = new Set(rows.map((r) => r.staff)).size
  const totalHours = rows.reduce((sum, r) => {
    const [sh, sm] = r.start.split(':').map(Number)
    const [eh, em] = r.end.split(':').map(Number)
    return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60
  }, 0)

  const statsY = options.scope === 'single' ? 40 : 38
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(
    `${totalShifts} shifts · ${uniqueStaff} staff · ${totalHours.toFixed(1)} total hours`,
    14, statsY,
  )
  doc.setTextColor(0)

  // Table
  const tableData = rows.map((r) => [
    r.date, r.day, r.staff, r.role, r.start, r.end, r.duration, r.source,
  ])

  autoTable(doc, {
    startY: statsY + 6,
    head: [['Date', 'Day', 'Staff', 'Role', 'Start', 'End', 'Duration', 'Source']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 24 }, 1: { cellWidth: 12 }, 2: { cellWidth: 30 },
      3: { cellWidth: 22 }, 4: { cellWidth: 16 }, 5: { cellWidth: 16 },
      6: { cellWidth: 18 }, 7: { cellWidth: 20 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} · Generated ${new Date().toLocaleDateString()}`,
        14, doc.internal.pageSize.height - 10,
      )
    },
  })

  // Per-staff pages (when exporting all)
  if (options.scope === 'all') {
    const staffGroups = new Map<string, typeof rows>()
    for (const row of rows) {
      const existing = staffGroups.get(row.staff)
      if (existing) existing.push(row)
      else staffGroups.set(row.staff, [row])
    }

    for (const [staffName, staffRows] of staffGroups) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text(staffName, 14, 20)

      const staffRole = staffRows[0]?.role || ''
      if (staffRole) {
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text(staffRole, 14, 27)
        doc.setTextColor(0)
      }

      const staffTotalHours = staffRows.reduce((sum, r) => {
        const [sh, sm] = r.start.split(':').map(Number)
        const [eh, em] = r.end.split(':').map(Number)
        return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60
      }, 0)

      doc.setFontSize(9)
      doc.setTextColor(80)
      doc.text(`${staffRows.length} shifts · ${staffTotalHours.toFixed(1)} hours`, 14, 34)
      doc.setTextColor(0)

      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Day', 'Start', 'End', 'Duration', 'Source']],
        body: staffRows.map((r) => [r.date, r.day, r.start, r.end, r.duration, r.source]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      })
    }
  }

  const blob = doc.output('blob')
  downloadBlob(blob, `${options.filename}.pdf`)
}
