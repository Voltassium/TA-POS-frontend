import * as XLSX from 'xlsx';

export interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
    format?: (value: any, row: any) => string | number;
}

/**
 * Export data to a properly formatted .xlsx Excel file.
 * @param data - Array of data objects
 * @param columns - Column definitions with header, key, optional width and formatter
 * @param filename - Output filename (without extension)
 */
export function exportToExcel(data: any[], columns: ExcelColumn[], filename: string): void {
    // Build header row
    const headers = columns.map(col => col.header);

    // Build data rows
    const rows = data.map(row =>
        columns.map(col => {
            const value = row[col.key];
            if (col.format) {
                return col.format(value, row);
            }
            return value ?? '';
        })
    );

    // Create worksheet from array of arrays
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = columns.map(col => ({
        wch: col.width || Math.max(col.header.length + 2, 15)
    }));

    // Create workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Generate and download the file
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

export interface ExcelSheet {
    name: string;
    data: any[];
    columns: ExcelColumn[];
}

/**
 * Export multiple sheets to a single Excel file.
 * @param sheets - Array of sheet configurations
 * @param filename - Output filename (without extension)
 */
export function exportMultipleSheetsToExcel(sheets: ExcelSheet[], filename: string): void {
    const wb = XLSX.utils.book_new();

    sheets.forEach(sheet => {
        const headers = sheet.columns.map(col => col.header);
        const rows = sheet.data.map(row =>
            sheet.columns.map(col => {
                const value = row[col.key];
                if (col.format) {
                    return col.format(value, row);
                }
                return value ?? '';
            })
        );

        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!cols'] = sheet.columns.map(col => ({
            wch: col.width || Math.max(col.header.length + 2, 15)
        }));

        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
}
