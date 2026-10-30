import { UserRole } from '@/types/database';

/**
 * Menggabungkan class Tailwind CSS dengan aman
 */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Format angka menjadi mata uang Rupiah (IDR)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal YYYY-MM-DD ke format Bahasa Indonesia (contoh: 27 Oktober 2026)
 */
export function formatTanggalIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Mendapatkan nama tampilan untuk Role pengguna
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'komti':
      return 'Admin • Komti ST04';
    case 'wakomti':
      return 'Admin • Wakomti ST04';
    case 'bendahara':
      return 'Admin • Bendahara';
    case 'sekretaris':
      return 'Admin • Sekretaris';
    case 'mahasiswa':
      return 'Mahasiswa ST04';
    default:
      return 'Mahasiswa';
  }
}

export function isAdminRole(role: UserRole): boolean {
  return ['komti', 'wakomti', 'bendahara', 'sekretaris'].includes(role);
}

/**
 * Mendapatkan inisial dari nama lengkap untuk Avatar (mengabaikan singkatan/gelar bertitik bila ada kata lain)
 */
export function getInitials(name: string): string {
  if (!name) return 'ST';
  const rawParts = name
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^a-zA-Z]/g, ''))
    .filter(Boolean);

  if (rawParts.length === 0) return 'ST';
  if (rawParts.length === 1) return rawParts[0].substring(0, 2).toUpperCase();

  // Jika kata pertama adalah singkatan seperti "Moch." atau "Dr." dan ada >= 3 kata, ambil kata ke-1 & ke-2 yang bermakna
  const firstOriginal = name.trim().split(/\s+/)[0];
  if (firstOriginal.endsWith('.') && rawParts.length >= 3) {
    return (rawParts[0][0] + rawParts[1][0]).toUpperCase();
  }

  return (rawParts[0][0] + rawParts[rawParts.length - 1][0]).toUpperCase();
}

/**
 * Export data ke file Excel (.xls SpreadsheetML / CSV UTF-8 BOM)
 */
export function exportToExcel(
  filename: string,
  sheetTitle: string,
  headers: string[],
  rows: (string | number)[][]
) {
  if (typeof window === 'undefined') return;

  // Buat HTML Table kompatibel Microsoft Excel (.xls) dengan styling rapi
  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8" />
      <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
        th { background-color: #5c3724; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        td { border: 1px solid #cbd5e1; padding: 6px 12px; }
        .title { font-size: 14pt; font-weight: bold; color: #5c3724; margin-bottom: 4px; }
        .subtitle { font-size: 10pt; color: #475569; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="title">TONGKRONGAN ST04 - IPB UNIVERSITY</div>
      <div class="subtitle">${sheetTitle} | Diekspor pada: ${new Date().toLocaleString('id-ID')}</div>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td>${String(cell ?? '').replace(/</g, '&lt;')}</td>`)
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', tableHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data ke dokumen PDF siap cetak / simpan
 */
export function exportToPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  summaryStats?: { label: string; value: string }[]
) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank', 'width=960,height=720');
  if (!printWindow) {
    alert('Mohon izinkan pop-up di browser Anda untuk mengekspor PDF.');
    return;
  }

  const statsHtml = summaryStats
    ? `<div class="stats-grid">
        ${summaryStats
          .map(
            (s) => `
          <div class="stat-box">
            <div class="stat-label">${s.label}</div>
            <div class="stat-val">${s.value}</div>
          </div>`
          )
          .join('')}
      </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>${title} - Tongkrongan ST04</title>
      <style>
        @page { size: A4; margin: 16mm; }
        body { font-family: 'Segoe UI', Inter, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #5c3724; padding-bottom: 14px; margin-bottom: 20px; }
        .brand { font-size: 20px; font-weight: 800; color: #5c3724; letter-spacing: -0.5px; }
        .subbrand { font-size: 12px; color: #475569; margin-top: 2px; }
        .doc-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        .doc-sub { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        .stats-grid { display: flex; gap: 12px; margin-bottom: 18px; }
        .stat-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; background: #faf5ef; }
        .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
        .stat-val { font-size: 15px; font-weight: 700; color: #5c3724; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background-color: #5c3724; color: white; text-align: left; padding: 8px 10px; border: 1px solid #4e2e1d; }
        td { padding: 7px 10px; border: 1px solid #cbd5e1; vertical-align: top; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .footer { margin-top: 28px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">TONGKRONGAN ST04</div>
          <div class="subbrand">Platform Manajemen Kelas & Angkatan Mahasiswa • IPB University</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #475569;">
          Dicetak: ${new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>
      <div class="doc-title">${title}</div>
      <div class="doc-sub">${subtitle}</div>
      ${statsHtml}
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${r
                  .map((c) => `<td>${String(c ?? '')}</td>`)
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        <span>Dokumen Resmi Kelas ST04 • Digenerate otomatis oleh Sistem Tongkrongan ST04</span>
        <span>Halaman 1</span>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 250);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
