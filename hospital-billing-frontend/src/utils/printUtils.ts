// Utility functions for printing payment receipts

export interface HospitalInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

/**
 * Print a payment receipt
 * @param payment - Payment object to print receipt for
 * @param hospitalInfo - Optional hospital information for header
 */
export const printPaymentReceipt = (
  payment: any,
  hospitalInfo?: HospitalInfo
) => {
  // Create a new window for printing
  const printWindow = window.open(
    '',
    '_blank',
    'width=800,height=900,scrollbars=yes'
  );

  if (!printWindow) {
    alert(
      'Popup blocked! Please allow popups for this site to print receipts.'
    );
    return;
  }

  // Set up the print window document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - ${payment.reference}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: white;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        
        .header .subtitle {
          color: #666;
          font-size: 14px;
        }
        
        .receipt-title {
          text-align: center;
          margin: 30px 0;
        }
        
        .receipt-title h2 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .receipt-title .reference {
          color: #666;
          font-size: 16px;
        }
        
        .info-section {
          margin-bottom: 25px;
        }
        
        .info-section h3 {
          font-size: 18px;
          margin-bottom: 15px;
          color: #2c3e50;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 20px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .info-row .label {
          color: #666;
          font-weight: normal;
        }
        
        .info-row .value {
          font-weight: 600;
          text-align: right;
        }
        
        .payment-summary {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          background-color: #f8f9fa;
        }
        
        .payment-summary h3 {
          text-align: center;
          margin-bottom: 20px;
          color: #2c3e50;
        }
        
        .amount-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .amount-row.total {
          font-size: 18px;
          font-weight: bold;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          margin-top: 15px;
        }
        
        .amount-row.total .value {
          color: #27ae60;
        }
        
        .notes {
          margin: 25px 0;
        }
        
        .notes-content {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 15px;
          background-color: #f9f9f9;
          font-style: italic;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        
        .footer .thank-you {
          font-size: 16px;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        
        .divider {
          border: none;
          height: 1px;
          background-color: #ddd;
          margin: 20px 0;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .receipt-container {
            margin: 0;
            padding: 15px;
          }
          
          .info-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @page {
          margin: 0.5in;
          size: auto;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <h1>${hospitalInfo?.name || 'HealthCare Medical Center'}</h1>
          <div class="subtitle">${
            hospitalInfo?.address || '123 Medical Drive, Health City, HC 12345'
          }</div>
          <div class="subtitle">Phone: ${
            hospitalInfo?.phone || '+1 (555) 123-4567'
          } | Email: ${hospitalInfo?.email || 'billing@healthcare.com'}</div>
        </div>
        
        <div class="receipt-title">
          <h2>PAYMENT RECEIPT</h2>
          <div class="reference">Receipt #${payment.reference}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-section">
            <h3>Payment Details</h3>
            <div class="info-row">
              <span class="label">Payment ID:</span>
              <span class="value">${payment.id?.slice(-12) || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Reference:</span>
              <span class="value">${payment.reference}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Method:</span>
              <span class="value">${payment.method}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value">${payment.status}</span>
            </div>
            <div class="info-row">
              <span class="label">Date Processed:</span>
              <span class="value">${
                payment.processedAt
                  ? new Date(payment.processedAt).toLocaleDateString()
                  : 'N/A'
              }</span>
            </div>
            <div class="info-row">
              <span class="label">Processed By:</span>
              <span class="value">${payment.processedBy || 'System'}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Patient Information</h3>
            <div class="info-row">
              <span class="label">Patient Name:</span>
              <span class="value">${payment.patient?.firstName || ''} ${
    payment.patient?.lastName || ''
  }</span>
            </div>
            <div class="info-row">
              <span class="label">Patient ID:</span>
              <span class="value">${payment.patient?.patientId || 'N/A'}</span>
            </div>
            ${
              payment.patient?.phone
                ? `
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${payment.patient.phone}</span>
            </div>
            `
                : ''
            }
            ${
              payment.patient?.email
                ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${payment.patient.email}</span>
            </div>
            `
                : ''
            }
          </div>
        </div>
        
        ${
          payment.invoice
            ? `
        <hr class="divider">
        
        <div class="info-section">
          <h3>Invoice Information</h3>
          <div class="info-grid">
            <div>
              <div class="info-row">
                <span class="label">Invoice Number:</span>
                <span class="value">${
                  payment.invoice.invoiceNumber ||
                  payment.invoice.number ||
                  'N/A'
                }</span>
              </div>
              <div class="info-row">
                <span class="label">Invoice Total:</span>
                <span class="value">${
                  payment.invoice.totalAmount
                    ? '$' + payment.invoice.totalAmount.toFixed(2)
                    : 'N/A'
                }</span>
              </div>
            </div>
            <div>
              <div class="info-row">
                <span class="label">Due Date:</span>
                <span class="value">${
                  payment.invoice.dueDate
                    ? new Date(payment.invoice.dueDate).toLocaleDateString()
                    : 'N/A'
                }</span>
              </div>
              <div class="info-row">
                <span class="label">Remaining Balance:</span>
                <span class="value">${
                  payment.invoice.balance
                    ? '$' + payment.invoice.balance.toFixed(2)
                    : 'N/A'
                }</span>
              </div>
            </div>
          </div>
        </div>
        `
            : ''
        }
        
        <div class="payment-summary">
          <h3>Payment Summary</h3>
          <div class="amount-row">
            <span>Payment Amount:</span>
            <span class="value">$${payment.amount.toFixed(2)}</span>
          </div>
          ${
            payment.fee && payment.fee > 0
              ? `
          <div class="amount-row">
            <span>Processing Fee:</span>
            <span class="value">$${payment.fee.toFixed(2)}</span>
          </div>
          `
              : ''
          }
          <div class="amount-row total">
            <span>Total Paid:</span>
            <span class="value">$${(
              payment.amount + (payment.fee || 0)
            ).toFixed(2)}</span>
          </div>
        </div>
        
        ${
          payment.notes
            ? `
        <div class="notes">
          <h3>Notes</h3>
          <div class="notes-content">${payment.notes}</div>
        </div>
        `
            : ''
        }
        
        <div class="footer">
          <div class="thank-you">Thank you for your payment!</div>
          <div>Please keep this receipt for your records.</div>
          <br>
          <div style="font-size: 12px;">
            Receipt generated on ${new Date().toLocaleDateString()} | 
            This is an automatically generated receipt.
          </div>
        </div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for the content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close the window after printing (optional)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };
};

/**
 * Download payment receipt as PDF (alternative implementation)
 * This requires html2pdf or similar library
 */
export const downloadPaymentReceiptAsPDF = async (
  payment: any,
  hospitalInfo?: HospitalInfo
) => {
  // This would require installing html2pdf library
  // For now, we'll just trigger the print function
  // In a real implementation, you would:
  // 1. Install html2pdf: npm install html2pdf.js
  // 2. Import it: import html2pdf from 'html2pdf.js';
  // 3. Create HTML content and convert to PDF

  console.log('PDF download would be implemented with html2pdf.js library');
  printPaymentReceipt(payment, hospitalInfo);
};
