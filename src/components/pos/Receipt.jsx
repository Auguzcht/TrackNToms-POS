import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import tomsLogo from '../../assets/TomNToms-Logo-1.png';
import supabase from '../../services/supabase';

const Receipt = ({ 
  order, 
  cashier, 
  paymentMethod, 
  cashAmount,
  change,
  saleId,
  onPrintReceipt,
  onNewSale
}) => {
  const [printing, setPrinting] = useState(false);
  const { user } = useAuth();
  const [staffInfo, setStaffInfo] = useState(null);
  
  // Fetch staff info when component mounts
  useEffect(() => {
    const fetchStaffInfo = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('staff')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .single();
          
          if (!error && data) {
            setStaffInfo(data);
          } else {
            console.warn('Staff info not found, using auth metadata');
            setStaffInfo({
              first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Staff',
              last_name: user.user_metadata?.last_name || 'User'
            });
          }
        } catch (err) {
          console.error('Error fetching staff info:', err);
          // Fallback to user metadata
          setStaffInfo({
            first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Staff',
            last_name: user.user_metadata?.last_name || 'User'
          });
        }
      }
    };
    
    fetchStaffInfo();
  }, [user]);
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const handlePrint = () => {
    setPrinting(true);
    
    setTimeout(() => {
      onPrintReceipt();
      setPrinting(false);
    }, 1500);
  };

  // Function to get the display name
  const getCashierName = () => {
    if (staffInfo) {
      return `${staffInfo.first_name} ${staffInfo.last_name || ''}`;
    } else if (user?.first_name) {
      return `${user.first_name} ${user.last_name || ''}`;
    } else if (user?.user_metadata?.first_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return "Cashier";
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex flex-col items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <img src={tomsLogo} alt="Tom N Toms Logo" className="h-12 mb-2" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Receipt</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
          Order #{saleId}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
          Tom N Toms Coffee<br />
          JP Laurel Avenue, Bajada<br />
          8000 Davao City, Philippines
        </p>
      </div>
      
      <div className="overflow-y-auto mb-4 flex-grow">
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-600 dark:text-gray-400">Date:</span>
          <span className="text-gray-900 dark:text-gray-100">{formatDate(new Date())}</span>
        </div>
        
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-600 dark:text-gray-400">Cashier:</span>
          <span className="text-gray-900 dark:text-gray-100">{getCashierName()}</span>
        </div>
        
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
            <span className="text-gray-900 dark:text-gray-100 capitalize">{paymentMethod}</span>
          </div>
          
          {paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Cash Amount:</span>
                <span className="text-gray-900 dark:text-gray-100">₱{cashAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Change:</span>
                <span className="text-gray-900 dark:text-gray-100">₱{change.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Order Items</h3>
        <div className="space-y-2 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">×{item.quantity}</span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">₱{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="text-gray-900 dark:text-gray-100">₱{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tax (12%):</span>
            <span className="text-gray-900 dark:text-gray-100">₱{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-medium mt-2">
            <span className="text-gray-800 dark:text-gray-200">Total:</span>
            <span className="text-primary">₱{order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Thank you for choosing Tom N Toms!</p>
          <p>JP Laurel Avenue, Bajada, Davao City</p>
          <p>Please come again!</p>
        </div>
      </div>
      
      <div className="mt-auto flex space-x-3">
        <Button
          variant="outline"
          fullWidth
          onClick={handlePrint}
          disabled={printing}
        >
          {printing ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Printing...
            </div>
          ) : (
            "Print Receipt"
          )}
        </Button>
        
        <Button
          fullWidth
          onClick={onNewSale}
        >
          New Sale
        </Button>
      </div>
    </Card>
  );
};

export default Receipt;