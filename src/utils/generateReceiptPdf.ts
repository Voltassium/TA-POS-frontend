import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReceiptItem {
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface ReceiptPayment {
    payment_method: string;
    amount_paid: number;
    timestamp: string;
}

export interface ReceiptData {
    order_code: string;
    table_id: number | null;
    customer_name: string | null;
    staff_name: string;
    total_amount: number;
    created_at: string;
    items: ReceiptItem[];
    payment: ReceiptPayment | null;
}

function formatCurrency(value: number): string {
    return (value ?? 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Generate a nicely formatted PDF receipt and return its blob URL for preview.
 */
export function generateReceiptPdf(data: ReceiptData): string {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Thermal receipt width (80mm), auto-expand height
    });

    const pageWidth = 80;
    const margin = 5;
    const contentWidth = pageWidth - margin * 2;
    let y = 10;

    // ─── Header ───
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SeliPOS', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Nota Penjualan', pageWidth / 2, y, { align: 'center' });
    y += 5;

    // Dashed separator
    doc.setLineDashPattern([1, 1], 0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    // ─── Order Info ───
    doc.setFontSize(8);
    const infoLines = [
        ['Kode', data.order_code],
        ['Tanggal', formatDate(data.created_at)],
        ['Kasir', data.staff_name || '-'],
        ['Meja', data.table_id != null ? String(data.table_id) : '-'],
        ['Pelanggan', data.customer_name || '-']
    ];

    for (const [label, value] of infoLines) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 20, y);
        y += 4;
    }

    y += 1;
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;

    // ─── Items Table ───
    const tableBody = data.items.map(item => [
        item.product_name || '-',
        String(item.quantity),
        formatCurrency(item.unit_price),
        formatCurrency(item.subtotal)
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Produk', 'Qty', 'Harga', 'Subtotal']],
        body: tableBody,
        theme: 'plain',
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        headStyles: {
            fontStyle: 'bold',
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            lineWidth: 0.2
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 8, halign: 'center' },
            2: { cellWidth: 17, halign: 'right' },
            3: { cellWidth: 20, halign: 'right' }
        }
    });

    y = (doc as any).lastAutoTable.finalY + 3;

    // ─── Separator ───
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    // ─── Totals ───
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', margin, y);
    doc.text(formatCurrency(data.total_amount), pageWidth - margin, y, { align: 'right' });
    y += 5;

    if (data.payment) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        doc.text('Metode:', margin, y);
        doc.text(data.payment.payment_method, pageWidth - margin, y, { align: 'right' });
        y += 4;

        doc.text('Dibayar:', margin, y);
        doc.text(formatCurrency(data.payment.amount_paid), pageWidth - margin, y, { align: 'right' });
        y += 4;

        const change = data.payment.amount_paid - data.total_amount;
        if (change > 0) {
            doc.text('Kembalian:', margin, y);
            doc.text(formatCurrency(change), pageWidth - margin, y, { align: 'right' });
            y += 4;
        }

        doc.text('Waktu Bayar:', margin, y);
        doc.text(formatDate(data.payment.timestamp), pageWidth - margin, y, { align: 'right' });
        y += 5;
    }

    // ─── Footer ───
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Terima kasih atas kunjungan Anda!', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(7);
    doc.text('Barang yang sudah dibeli tidak dapat', pageWidth / 2, y, { align: 'center' });
    y += 3;
    doc.text('ditukar atau dikembalikan.', pageWidth / 2, y, { align: 'center' });

    // Generate blob URL for preview
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
}
