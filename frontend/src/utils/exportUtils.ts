/**
 * Professional CSV / Excel & PDF Export Utility for DK Academy Admin Portals.
 */

export interface ExportPDFOptions {
  title: string;
  subtitle?: string;
  filename?: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Exports tabular data as an Excel-compatible CSV file with UTF-8 BOM.
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const sanitizeCell = (cell: string | number): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(sanitizeCell).join(','));

  for (const row of rows) {
    csvRows.push(row.map(sanitizeCell).join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel properly recognizes Unicode / INR symbol (₹)
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanFilename = filename.toLowerCase().endsWith('.csv') || filename.toLowerCase().endsWith('.xlsx')
    ? filename.replace(/\.xlsx$/i, '.csv')
    : `${filename}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive, printable PDF report view with DK Academy Kota Pedagogy letterhead.
 * Opens an isolated print preview dialogue so the administrator can save as PDF directly.
 */
export function exportToPDF({
  title,
  subtitle,
  filename = 'dk-academy-report',
  headers,
  rows
}: ExportPDFOptions): void {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Please allow popups in your browser to generate the PDF report.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const tableHeaderHtml = headers
    .map((h) => `<th style="padding: 10px 12px; background: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; border: 1px solid #334155;">${escapeHtml(h)}</th>`)
    .join('');

  const tableRowsHtml = rows
    .map(
      (row, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        ${row
          .map(
            (c) => `<td style="padding: 9px 12px; font-size: 12px; color: #1e293b; border: 1px solid #e2e8f0; vertical-align: top;">${escapeHtml(String(c ?? ''))}</td>`
          )
          .join('')}
      </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)} - DK Academy Official Report</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm 10mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #0f172a;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 16px;
          border-bottom: 2px solid #2563eb;
          margin-bottom: 20px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .brand-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        .report-info {
          text-align: right;
          font-size: 12px;
          color: #64748b;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          background: #dbeafe;
          color: #1d4ed8;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }
        .report-title-box {
          margin-bottom: 16px;
        }
        .report-heading {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .report-desc {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; background: #eff6ff; padding: 10px 16px; border-radius: 8px; border: 1px solid #bfdbfe; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 600; color: #1e40af;">📄 PDF Print Preview Ready (${rows.length} total records)</span>
        <div>
          <button onclick="window.print()" style="padding: 6px 14px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-right: 8px;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding: 6px 12px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Close</button>
        </div>
      </div>

      <div class="header">
        <div>
          <h1 class="brand-title">DK ACADEMY JEE &amp; BITSAT</h1>
          <div class="brand-sub">Kota Pedagogy System • Premier IIT JEE &amp; BITSAT Training Portal</div>
        </div>
        <div class="report-info">
          <div><strong>Generated on:</strong> ${currentDate}</div>
          <span class="badge">Official Admin Export</span>
        </div>
      </div>

      <div class="report-title-box">
        <h2 class="report-heading">${escapeHtml(title)}</h2>
        ${subtitle ? `<p class="report-desc">${escapeHtml(subtitle)}</p>` : ''}
      </div>

      <table>
        <thead>
          <tr>${tableHeaderHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>DK Academy ERP • Confidential Student &amp; Academic Records</span>
        <span>Total Records: ${rows.length}</span>
      </div>

      <script>
        // Automatically open the print dialog when document finishes loading
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

