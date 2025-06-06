import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../services/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

const VoidTransaction = ({ sale, onVoidComplete, onCancel }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [approvalCode, setApprovalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [manager, setManager] = useState(null);
  const [step, setStep] = useState(1); // 1 = reason, 2 = approval
  const [error, setError] = useState('');
  
  const validateReason = () => {
    if (!reason.trim()) {
      setError('Please provide a void reason');
      return false;
    }
    setError('');
    setStep(2);
    return true;
  };
  
  const validateApprovalCode = async () => {
    if (!approvalCode.trim()) {
      setError('Please enter manager approval code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check if approval code matches a manager's PIN
      const { data, error: managerError } = await supabase
        .from('staff')
        .select(`
          staff_id, 
          first_name, 
          last_name,
          role_id,
          roles:role_id (role_name)
        `)
        .eq('manager_pin', approvalCode.trim())
        .single();
      
      if (managerError || !data) {
        setError('Invalid manager approval code');
        setLoading(false);
        return;
      }
      
      // Verify manager role
      if (data.roles?.role_name !== 'Manager' && data.roles?.role_name !== 'Admin') {
        setError('This approval code does not belong to a manager');
        setLoading(false);
        return;
      }
      
      setManager(data);
      await processVoid(data.staff_id);
      
    } catch (err) {
      console.error('Error validating approval code:', err);
      setError('Error validating approval code');
      setLoading(false);
    }
  };
  
  const processVoid = async (managerStaffId) => {
    try {
      // Get current user's staff ID
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('staff_id')
        .eq('user_id', user.id)
        .single();
      
      if (staffError) {
        throw new Error('Could not identify current staff member');
      }
      
      // Call the void_sale function
      const { data: voidResult, error: voidError } = await supabase
        .rpc('void_sale', {
          p_sale_id: sale.sale_id,
          p_requested_by: staffData.staff_id,
          p_approved_by: managerStaffId,
          p_reason: reason
        });
      
      if (voidError) {
        throw new Error(voidError.message || 'Failed to void sale');
      }
      
      if (!voidResult.success) {
        throw new Error(voidResult.message || 'Failed to void sale');
      }
      
      toast.success('Sale has been successfully voided');
      onVoidComplete(voidResult);
      
    } catch (err) {
      console.error('Error processing void:', err);
      setError(err.message || 'Error processing void');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVoidSale = async () => {
    if (!reason) {
      setError('Please provide a reason for voiding this sale');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use the voidSale function with the current user's staff_id
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('staff_id')
        .eq('user_id', user.id)
        .single();
      
      if (staffError) {
        throw new Error('Could not identify current staff member');
      }
      
      const { data: voidResult, error: voidError } = await supabase
        .rpc('void_sale', {
          p_sale_id: sale.sale_id,
          p_requested_by: staffData.staff_id,
          p_reason: reason
        });
      
      if (voidError) {
        throw new Error(voidError.message || 'Failed to void sale');
      }
      
      if (!voidResult.success) {
        throw new Error(voidResult.message || 'Failed to void sale');
      }
      
      toast.success(`Sale #${sale.sale_id} has been voided successfully`);
      onVoidComplete(voidResult);
      
    } catch (error) {
      console.error('Error voiding sale:', error);
      setError(`Failed to void sale: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-xl font-semibold text-[#571C1F]">Void Transaction</h2>
        <p className="text-sm text-gray-600 mt-1">
          Sale #{sale.sale_id} for {parseFloat(sale.total_amount).toFixed(2)}
        </p>
      </div>
      
      <div className="flex-grow">
        {step === 1 ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Void
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#571C1F]"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for voiding this transaction"
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-gray-600">
              Manager approval required to void this transaction.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Approval Code
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#571C1F]"
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value)}
                placeholder="Enter manager approval code"
              />
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        
        {step === 1 ? (
          <Button
            onClick={validateReason}
            disabled={loading || !reason.trim()}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={validateApprovalCode}
            disabled={loading || !approvalCode.trim()}
          >
            {loading ? 'Processing...' : 'Void Sale'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VoidTransaction;