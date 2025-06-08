/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file without extension
 * @returns {Blob} CSV blob
 */
export const exportToCSV = (data) => {
  if (!data || !data.length) {
    throw new Error('No data provided for export');
  }
  
  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle special cases
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      
      // Escape commas and quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    
    csvRows.push(values.join(','));
  }
  
  // Create the CSV blob
  const csvContent = csvRows.join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

/**
 * Export data to PDF format
 * @param {Object} reportData - Report data to export
 * @returns {Blob} PDF blob
 */
export const exportToPDF = async (reportData) => {
  try {
    // This is a stub implementation that would be replaced with proper PDF generation
    // In a real application, you would use a library like pdfmake, jsPDF, or html2pdf
    
    // For now, we're just creating a JSON blob as a placeholder
    console.warn('PDF export is a placeholder. Implement with proper PDF library.');
    const jsonContent = JSON.stringify(reportData, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
    
    // Example with jsPDF if implemented:
    /*
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(reportData.title, 14, 22);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Period: ${reportData.dateRange.formatted}`, 14, 30);
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Summary', 14, 40);
    
    // Create table data based on report type
    let tableData = [];
    
    if (reportData.type === 'sales') {
      tableData = [
        ['Total Sales', `$${reportData.summary.totalSales.toFixed(2)}`],
        ['Transactions', reportData.summary.totalTransactions],
        ['Average Order', `$${reportData.summary.averageOrderValue.toFixed(2)}`]
      ];
    }
    
    // Add table
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: tableData
    });
    
    // Return PDF as blob
    return doc.output('blob');
    */
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw new Error(`PDF generation failed: ${err.message}`);
  }
};

/**
 * Trigger file download for a blob
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Name for the downloaded file
 */
export const downloadBlob = (blob, filename) => {
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};