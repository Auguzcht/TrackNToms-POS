// test-signup.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Public client
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testUserCreation() {
  try {
    console.log('Creating test user...');
    
    // Use a more realistic email address
    const testEmail = `user${Date.now()}@gmail.com`; // Use timestamp for uniqueness
    
    // Create user via signUp
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          role: 'Cashier',
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    if (error) {
      console.log('Signup failed, trying admin API:', error);
      
      // Use a different email for admin API
      const adminEmail = `admin${Date.now()}@gmail.com`;
      
      // Try admin API as fallback
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: 'AdminPassword123!',
        email_confirm: true,
        user_metadata: {
          role: 'Admin',
          first_name: 'Admin',
          last_name: 'User'
        }
      });
      
      if (adminError) {
        console.log('Admin API failed:', adminError);
        throw adminError;
      }
      
      console.log('User created via admin API:', adminData.user.id);
      
      // Add delay to let trigger complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify staff record was created
      const { data: staffData, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('*')
        .eq('user_id', adminData.user.id);
        
      if (staffError) {
        console.log('Error checking staff record:', staffError);
      } else if (staffData.length === 0) {
        console.log('No staff record found, creating manually...');
        
        // Get role ID
        const { data: roleData } = await supabaseAdmin
          .from('roles')
          .select('*')
          .eq('role_name', 'Admin')
          .limit(1);
          
        const roleId = roleData && roleData.length > 0 ? roleData[0].role_id : 1;
        
        // Create staff record manually
        const { data: newStaff, error: createError } = await supabaseAdmin
          .from('staff')
          .insert({
            user_id: adminData.user.id,
            email: adminEmail,
            first_name: 'Admin',
            last_name: 'User',
            role_id: roleId,
            status: 'Active',
            is_active: true
          })
          .select();
          
        if (createError) {
          console.log('Error manually creating staff record:', createError);
        } else {
          console.log('Manually created staff record:', newStaff);
        }
      } else {
        console.log('Staff record found:', staffData);
      }
    } else {
      console.log('User created via signup:', data.user.id);
      
      // Add delay to let trigger complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify staff record was created
      const { data: staffData, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('*')
        .eq('user_id', data.user.id);
        
      if (staffError) {
        console.log('Error checking staff record:', staffError);
      } else {
        console.log('Staff record created:', staffData);
      }
    }
  } catch (error) {
    console.error('Error in user creation process:', error);
  }
}

testUserCreation();