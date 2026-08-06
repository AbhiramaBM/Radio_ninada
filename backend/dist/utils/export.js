"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToCSV = convertToCSV;
function convertToCSV(data) {
    if (!data || !data.length)
        return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers
        .map((fieldName) => {
        const value = row[fieldName] !== null && row[fieldName] !== undefined ? String(row[fieldName]) : '';
        return `"${value.replace(/"/g, '""')}"`;
    })
        .join(','));
    return [headers.join(','), ...rows].join('\r\n');
}
