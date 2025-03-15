import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import Card from '../common/Card';
import { useAuth } from '../../hooks/useAuth';

// Separate printable receipt component
const PrintableReceipt = React.forwardRef(({ order, paymentMethod, cashAmount, change, saleId, user }, ref) => {
  // Format date
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div ref={ref} className="print-receipt p-5">
      <div className="text-center mb-4">
        <h2 className="font-bold text-[#571C1F] text-xl">Track N' Toms</h2>
        <p className="text-[#571C1F]/70 text-sm">123 Coffee Street, Cityville</p>
      </div>
      
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#571C1F]/70">Receipt #:</span>
        <span className="font-medium text-[#571C1F]">{saleId}</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-[#571C1F]/70">Cashier:</span>
        <span className="text-[#571C1F]">{user?.name || "Cashier"}</span>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="text-[#571C1F]/70">Date & Time:</span>
        <span className="text-[#571C1F]">{formattedDate}, {formattedTime}</span>
      </div>
      
      <div className="my-3 border-t border-b border-[#571C1F]/10 py-3">
        <div className="flex justify-between text-sm text-[#571C1F]/70 mb-2">
          <span>Item</span>
          <span>Amount</span>
        </div>
        
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm mb-1">
            <span className="text-[#571C1F]">{item.quantity}× {item.name}</span>
            <span className="text-[#571C1F]">₱{item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[#571C1F]/70">Subtotal:</span>
          <span className="text-[#571C1F]">₱{order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#571C1F]/70">Tax (12%):</span>
          <span className="text-[#571C1F]">₱{order.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-medium pt-1 border-t border-[#571C1F]/10">
          <span className="text-[#571C1F]">Total:</span>
          <span className="text-[#571C1F]">₱{order.total.toFixed(2)}</span>
        </div>
        
        <div className="pt-2 border-t border-dashed border-[#571C1F]/10 mt-2">
          <div className="flex justify-between">
            <span className="text-[#571C1F]/70">Payment Method:</span>
            <span className="font-medium capitalize text-[#571C1F]">{paymentMethod}</span>
          </div>
          
          {paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between">
                <span className="text-[#571C1F]/70">Cash Amount:</span>
                <span className="text-[#571C1F]">₱{cashAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#571C1F]/70">Change:</span>
                <span className="text-[#571C1F]">₱{change.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="text-center text-xs text-[#571C1F]/60 mt-4">
        Thank you for your purchase!
      </div>
    </div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';

const Payment = ({ 
  order, 
  onComplete,
  onCancel 
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [change, setChange] = useState(0);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [saleId, setSaleId] = useState('');
  
  // Receipt ref for printing
  const printReceiptRef = useRef(null);
  
  // Add this constant to match OrderBuilder's fixed height calc
  const checkoutHeight = 92; // Adjust this value to match OrderBuilder
  
  // Replace your current printing code with this simpler approach
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert("Please allow pop-ups for this website to print receipts.");
      return;
    }
    
    // Create the CSS styles for the print window
    const styles = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 30px;
          max-width: 300px;
          margin: 0 auto;
          color: #571C1F;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .receipt-header h2 {
          margin: 0;
          color: #571C1F;
          font-size: 24px;
        }
        .receipt-header p {
          margin: 5px 0 0;
          color: rgba(87, 28, 31, 0.7);
          font-size: 14px;
        }
        .receipt-info {
          margin-bottom: 20px;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 14px;
        }
        .receipt-label {
          color: rgba(87, 28, 31, 0.7);
        }
        .receipt-items {
          border-top: 1px solid rgba(87, 28, 31, 0.1);
          border-bottom: 1px solid rgba(87, 28, 31, 0.1);
          padding: 10px 0;
          margin: 15px 0;
        }
        .receipt-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: rgba(87, 28, 31, 0.7);
          font-size: 14px;
        }
        .receipt-total {
          border-top: 1px solid rgba(87, 28, 31, 0.1);
          padding-top: 5px;
          font-weight: 500;
        }
        .receipt-payment {
          border-top: 1px dashed rgba(87, 28, 31, 0.1);
          margin-top: 10px;
          padding-top: 10px;
        }
        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: rgba(87, 28, 31, 0.6);
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    `;
    
    // Format date
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Generate receipt items HTML
    const itemsHTML = order.items.map(item => `
      <div class="receipt-row">
        <span>${item.quantity}× ${item.name}</span>
        <span>₱${item.subtotal.toFixed(2)}</span>
      </div>
    `).join('');
    
    // Generate payment method specific HTML
    let paymentHTML = '';
    if (paymentMethod === 'cash') {
      paymentHTML = `
        <div class="receipt-row">
          <span class="receipt-label">Cash Amount:</span>
          <span>₱${parseFloat(cashAmount).toFixed(2)}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Change:</span>
          <span>₱${change.toFixed(2)}</span>
        </div>
      `;
    }
    
    // Create the receipt HTML content
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${saleId}</title>
        ${styles}
      </head>
      <body>
        <div class="receipt-header">
          <h2>Track N' Toms</h2>
          <p>123 Coffee Street, Cityville</p>
        </div>
        
        <div class="receipt-info">
          <div class="receipt-row">
            <span class="receipt-label">Receipt #:</span>
            <span>${saleId}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Cashier:</span>
            <span>${user?.name || 'Cashier'}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Date & Time:</span>
            <span>${formattedDate}, ${formattedTime}</span>
          </div>
        </div>
        
        <div class="receipt-items">
          <div class="receipt-item-header">
            <span>Item</span>
            <span>Amount</span>
          </div>
          ${itemsHTML}
        </div>
        
        <div class="receipt-totals">
          <div class="receipt-row">
            <span class="receipt-label">Subtotal:</span>
            <span>₱${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Tax (12%):</span>
            <span>₱${order.tax.toFixed(2)}</span>
          </div>
          <div class="receipt-row receipt-total">
            <span>Total:</span>
            <span>₱${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="receipt-payment">
          <div class="receipt-row">
            <span class="receipt-label">Payment Method:</span>
            <span style="text-transform: capitalize;">${paymentMethod}</span>
          </div>
          ${paymentHTML}
        </div>
        
        <div class="receipt-footer">
          Thank you for your purchase!
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            // Optional: close the window after printing
            // setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;
    
    // Write content to the new window
    printWindow.document.open();
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // Define payment methods with icons
  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'credit', name: 'Credit/Debit' },
    { id: 'gcash', name: 'GCash' },
    { id: 'maya', name: 'Maya' },
    { id: 'qr', name: 'QR Ph' }
  ];
  
  // Quick amount options for cash payments
  const quickAmounts = [
    order.total, // Exact amount
    Math.ceil(order.total / 50) * 50, // Round up to nearest 50
    Math.ceil(order.total / 100) * 100, // Round up to nearest 100
    Math.ceil(order.total / 500) * 500 // Round up to nearest 500
  ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b); // Remove duplicates and sort
  
  // Calculate change when cash amount changes
  const calculateChange = (amount) => {
    const parsedAmount = parseFloat(amount) || 0;
    const changeAmount = parsedAmount - order.total;
    setChange(changeAmount >= 0 ? changeAmount : 0);
  };
  
  useEffect(() => {
    // Pre-populate with exact amount by default
    setCashAmount(order.total.toFixed(2));
    calculateChange(order.total);
    console.log("Payment component mounted with order total:", order.total);
  }, [order.total]);
  
  // Handle cash amount input changes
  const handleCashAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input and decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setCashAmount(value);
      calculateChange(value);
    }
  };
  
  // Handle quick amount selections
  const handleQuickAmount = (amount) => {
    setCashAmount(amount.toFixed(2));
    calculateChange(amount);
  };
  
  // Handle payment method changes
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setError('');
  };
  
  // Simplified process payment function
  const handleProcessPayment = async () => {
    // Simple validation for cash payments
    if (paymentMethod === 'cash' && parseFloat(cashAmount) < order.total) {
      setError('Cash amount must be equal to or greater than the total amount');
      return;
    }
    
    setProcessingPayment(true);
    setError('');
    
    try {
      // Simulate a successful payment with a timeout
      setTimeout(() => {
        // Generate a simple receipt number
        const receiptNumber = 'TNT-' + Math.floor(100000 + Math.random() * 900000);
        
        setPaymentComplete(true);
        setSaleId(receiptNumber);
        
        // Call the parent component's completion handler with success
        onComplete({
          success: true,
          saleId: receiptNumber,
          paymentMethod,
          cashAmount: parseFloat(cashAmount),
          change
        });
        
        setProcessingPayment(false);
      }, 1500); // Simulate 1.5 second processing time
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
      setProcessingPayment(false);
    }
  };

  // Simplified new order function
  const handleNewOrder = () => {
    // Simply call the cancel handler from parent
    onCancel();
  };
  
  return (
    <Card className="h-full relative flex flex-col" style={{ height: "618px", maxHeight: "618px" }}>
      {/* Header section - exact same structure as OrderBuilder */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#571C1F]/10 flex-shrink-0">
        <h2 className="text-lg font-bold text-[#571C1F] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-[#571C1F]/80" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          {paymentComplete ? 'Receipt' : 'Complete Payment'}
        </h2>
        <button
          onClick={onCancel}
          disabled={processingPayment}
          className="px-3 py-1 rounded hover:bg-[#FFF6F2] text-[#571C1F]/70 hover:text-[#571C1F] group"
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {paymentComplete ? 'Done' : 'Back'}
          </span>
        </button>
      </div>
      
      {/* Hidden printable receipt component */}
      <div style={{ display: 'none' }}>
        <PrintableReceipt
          ref={printReceiptRef}
          order={order}
          paymentMethod={paymentMethod}
          cashAmount={parseFloat(cashAmount) || 0}
          change={change}
          saleId={saleId}
          user={user}
        />
      </div>
      
      {/* Scrollable content area - fixed with exact same dimensions as OrderBuilder */}
      <div 
        className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#571C1F]/10 scrollbar-track-transparent" 
        style={{ 
          height: `calc(618px - 65px - ${checkoutHeight}px)`,
          maxHeight: `calc(618px - 65px - ${checkoutHeight}px)`,
          paddingBottom: "10px"
        }}
      >
        <AnimatePresence mode="wait">
          {paymentComplete ? (
            <ReceiptView 
              order={order} 
              paymentMethod={paymentMethod} 
              cashAmount={parseFloat(cashAmount) || 0}
              change={change}
              saleId={saleId} 
              user={user}
              onNewOrder={handleNewOrder}
            />
          ) : (
            <PaymentForm 
              order={order}
              paymentMethod={paymentMethod}
              paymentMethods={paymentMethods}
              onPaymentMethodChange={handlePaymentMethodChange}
              cashAmount={cashAmount}
              onCashAmountChange={handleCashAmountChange}
              quickAmounts={quickAmounts}
              onQuickAmountSelect={handleQuickAmount}
              change={change}
              error={error}
              processing={processingPayment}
              onProcessPayment={handleProcessPayment}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Add border separator for visual consistency */}
      <div className="border-t border-[#571C1F]/10 h-0 flex-shrink-0 shadow-sm"></div>
      
      {/* Add bottom section with fixed height to match OrderBuilder */}
      <div className="pt-4 pb-3 bg-white rounded-b-lg flex-shrink-0" style={{ height: `${checkoutHeight}px` }}>
        {/* Bottom section content - payment button or receipt buttons */}
        {!paymentComplete ? (
          <div className="px-3">
            <motion.button
              whileHover={!processingPayment ? { scale: 1.02 } : {}}
              whileTap={!processingPayment ? { scale: 0.98 } : {}}
              disabled={processingPayment}
              onClick={handleProcessPayment}
              className="w-full py-3 px-4 rounded-lg font-medium text-white shadow-md bg-[#571C1F] hover:bg-[#4A1519] disabled:bg-[#571C1F]/50 flex items-center justify-center"
            >
              {processingPayment ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  Complete Payment
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </motion.button>
          </div>
        ) : (
          <div className="px-3">
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 px-4 rounded-lg font-medium border border-[#571C1F] text-[#571C1F] hover:bg-[#FFF6F2] flex items-center justify-center"
                onClick={handlePrint}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 px-4 rounded-lg font-medium text-white shadow-md bg-[#571C1F] hover:bg-[#4A1519] flex items-center justify-center"
                onClick={handleNewOrder}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Order
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Payment form component
const PaymentForm = ({ 
  order, 
  paymentMethod, 
  paymentMethods,
  onPaymentMethodChange,
  cashAmount,
  onCashAmountChange,
  quickAmounts,
  onQuickAmountSelect,
  change,
  error,
  processing,
  onProcessPayment
}) => {
  return (
    <div className="px-1">
      {/* Order summary */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#FFF6F2] p-4 rounded-lg mb-4 border border-[#571C1F]/10"
      >
        <h3 className="font-medium text-[#571C1F] mb-2 pb-2 border-b border-[#571C1F]/10">
          Order Summary
        </h3>
        <div className="space-y-1 mb-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-[#571C1F]">
              <span>{item.quantity}× {item.name}</span>
              <span>₱{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-[#571C1F]/10">
          <span className="text-[#571C1F]">Subtotal</span>
          <span className="text-[#571C1F]">₱{order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#571C1F]">Tax (12%)</span>
          <span className="text-[#571C1F]">₱{order.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-medium text-base pt-2 border-t border-dashed border-[#571C1F]/10 mt-1.5">
          <span className="text-[#571C1F]">Total</span>
          <span className="text-[#571C1F]">₱{order.total.toFixed(2)}</span>
        </div>
      </motion.div>

      {/* Payment methods */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4"
      >
        <h3 className="font-medium text-[#571C1F] mb-2">Payment Method</h3>
        <div className="grid grid-cols-3 gap-2">
          {paymentMethods.map((method) => (
            <motion.button
              key={method.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPaymentMethodChange(method.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                paymentMethod === method.id 
                  ? 'border-[#571C1F] bg-[#FFF6F2]' 
                  : 'border-gray-200 bg-white hover:bg-[#FFF6F2]/50'
              }`}
            >
              <div className={`rounded-full p-2 mb-1 ${paymentMethod === method.id ? 'bg-[#571C1F]/10' : 'bg-gray-100'}`}>
                {/* Payment method icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {method.id === 'cash' && <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
                  {method.id === 'credit' && <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
                  {method.id === 'gcash' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />}
                  {method.id === 'maya' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />}
                  {method.id === 'qr' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />}
                </svg>
              </div>
              <span className={`text-xs font-medium ${paymentMethod === method.id ? 'text-[#571C1F]' : 'text-gray-500'}`}>
                {method.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
      
      {/* Payment type specific forms */}
      <AnimatePresence>
        {paymentMethod === 'cash' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <h3 className="font-medium text-[#571C1F] mb-2">Cash Amount</h3>
            
            <div className="mb-3">
              <div className="flex items-center border border-[#571C1F]/30 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#571C1F]/30">
                <span className="px-3 py-2 bg-[#FFF6F2] text-[#571C1F] font-medium">₱</span>
                <input
                  type="text"
                  value={cashAmount}
                  onChange={onCashAmountChange}
                  className="flex-1 px-3 py-2 focus:outline-none text-right text-[#571C1F]"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <h4 className="text-xs text-[#571C1F]/70 mb-2">Quick Amount</h4>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onQuickAmountSelect(amount)}
                    className="px-3 py-1.5 bg-[#FFF6F2]/70 hover:bg-[#FFF6F2] text-[#571C1F] rounded-md border border-[#571C1F]/10 text-sm font-medium"
                  >
                    ₱{amount.toFixed(2)}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-[#FFF6F2] rounded-lg border border-[#571C1F]/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#571C1F]/80">Change:</span>
                <motion.span
                  key={change}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-lg text-[#571C1F]"
                >
                  ₱{change.toFixed(2)}
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
        
        {paymentMethod === 'credit' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <div className="p-4 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-lg text-center">
              <p className="text-[#571C1F] mb-2">Credit/Debit Card Payment</p>
              <p className="text-sm text-[#571C1F]/70">
                Please swipe card in the terminal or instruct the customer to insert/tap their card.
              </p>
            </div>
          </motion.div>
        )}
        
        {['gcash', 'maya', 'qr'].includes(paymentMethod) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <div className="p-4 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-lg text-center">
              <p className="text-[#571C1F] mb-2">
                {paymentMethod === 'gcash' && 'GCash Payment'}
                {paymentMethod === 'maya' && 'Maya Payment'}
                {paymentMethod === 'qr' && 'QR Ph Payment'}
              </p>
              <div className="bg-white p-4 rounded-lg mb-2 mx-auto w-40 h-40 flex items-center justify-center">
                <p className="text-gray-400 text-sm">QR Code</p>
              </div>
              <p className="text-sm text-[#571C1F]/70">
                Please scan the QR code using your mobile app to complete the payment.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 text-red-700 text-sm"
          >
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ReceiptView component - no longer needs forwardRef
const ReceiptView = ({ order, paymentMethod, cashAmount, change, saleId, user, onNewOrder }) => {
  // Format date
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-1"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        className="bg-white border border-[#571C1F]/10 rounded-lg p-5 mb-4 relative overflow-hidden"
      >
        {/* Success indicator */}
        <div className="mb-4 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { delay: 0.3, type: "spring" } }}
            className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.4 } }}
            className="mt-3 font-bold text-[#571C1F] text-lg"
          >
            Payment Complete
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            className="text-[#571C1F]/70 text-sm"
          >
            Your transaction has been successful
          </motion.p>
        </div>
        
        {/* Receipt content */}
        <div className="border-t border-dashed border-[#571C1F]/10 pt-4 mb-4">
          <div className="text-center mb-4">
            <h4 className="font-bold text-[#571C1F]">Track N' Toms</h4>
            <p className="text-[#571C1F]/70 text-xs">123 Coffee Street, Cityville</p>
          </div>
          
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#571C1F]/70">Receipt #:</span>
            <span className="font-medium text-[#571C1F]">{saleId}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-[#571C1F]/70">Cashier:</span>
            <span className="text-[#571C1F]">{user?.name || "Cashier"}</span>
          </div>

          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#571C1F]/70">Date & Time:</span>
            <span className="text-[#571C1F]">{formattedDate}, {formattedTime}</span>
          </div>
          
          <div className="my-3 border-t border-b border-[#571C1F]/10 py-3">
            <div className="flex justify-between text-sm text-[#571C1F]/70 mb-2">
              <span>Item</span>
              <span>Amount</span>
            </div>
            
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm mb-1">
                <span className="text-[#571C1F]">{item.quantity}× {item.name}</span>
                <span className="text-[#571C1F]">₱{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[#571C1F]/70">Subtotal:</span>
              <span className="text-[#571C1F]">₱{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#571C1F]/70">Tax (12%):</span>
              <span className="text-[#571C1F]">₱{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t border-[#571C1F]/10">
              <span className="text-[#571C1F]">Total:</span>
              <span className="text-[#571C1F]">₱{order.total.toFixed(2)}</span>
            </div>
            
            <div className="pt-2 border-t border-dashed border-[#571C1F]/10 mt-2">
              <div className="flex justify-between">
                <span className="text-[#571C1F]/70">Payment Method:</span>
                <span className="font-medium capitalize text-[#571C1F]">{paymentMethod}</span>
              </div>
              
              {paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#571C1F]/70">Cash Amount:</span>
                    <span className="text-[#571C1F]">₱{cashAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#571C1F]/70">Change:</span>
                    <span className="text-[#571C1F]">₱{change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-[#571C1F]/60 mb-2">
          Thank you for your purchase!
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Payment;