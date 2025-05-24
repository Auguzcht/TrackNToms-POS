// bypass-triggers.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createUserManually() {
  try {
    // Step 1: Create auth user directly
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      email_confirm: true
    });
    
    if (authError) {
      console.error('Auth user creation failed:', authError);
      return;
    }
    
    console.log('Auth user created successfully!', authData.user.id);
    
    // Step 2: Insert directly into the staff table
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert([
        {
          user_id: authData.user.id,
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          position: 'Admin',
          status: 'Active'
        }
      ]);
    
    if (staffError) {
      console.error('Staff record creation failed:', staffError);
    } else {
      console.log('Staff record created successfully!');
    }
  } catch (error) {
    console.error('Exception during process:', error);
  }
}

createUserManually();