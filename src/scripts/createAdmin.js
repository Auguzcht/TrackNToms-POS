// create-admin.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('Starting admin user creation process...');
    
    const adminEmail = 'admin@example.com';
    const adminPassword = 'AdminPassword123!';
    const adminName = 'Admin User';
    
    // Step 1: Check if user already exists in auth
    console.log('Checking if user already exists...');
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('email', adminEmail);
    
    if (checkError) {
      console.error('Error checking for existing user:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists in staff table.');
      return;
    }

    // Step 2: Create user in Auth system
    console.log('Creating user in Auth system...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'Admin',
        first_name: 'Admin',
        last_name: 'User'
      }
    });
    
    if (authError) {
      console.error('Error creating user in Auth system:', authError);
      return;
    }
    
    console.log('User created successfully in Auth system:', authData.user.id);
    
    // Step 3: Check if trigger successfully created staff record
    console.log('Checking if trigger created staff record...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for trigger
    
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('user_id', authData.user.id);
    
    if (staffError) {
      console.error('Error checking staff record:', staffError);
    }
    
    if (!staffData || staffData.length === 0) {
      console.log('Trigger did not create staff record. Using manual creation...');
      
      // Find Admin role_id
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('role_id')
        .eq('role_name', 'Admin')
        .limit(1);
      
      if (roleError) {
        console.error('Error fetching Admin role:', roleError);
        return;
      }
      
      if (!roleData || roleData.length === 0) {
        console.error('Admin role not found in the database');
        return;
      }
      
      const adminRoleId = roleData[0].role_id;
      
      // Create staff record manually
      const { data: manualStaffData, error: manualStaffError } = await supabaseAdmin
        .from('staff')
        .insert([{
          user_id: authData.user.id,
          email: adminEmail,
          first_name: 'Admin',
          last_name: 'User',
          role_id: adminRoleId,
          status: 'Active',
          is_active: true
        }])
        .select();
      
      if (manualStaffError) {
        console.error('Error creating manual staff record:', manualStaffError);
        return;
      }
      
      console.log('Staff record created manually:', manualStaffData);
    } else {
      console.log('Staff record created successfully by trigger:', staffData);
    }
    
    console.log('Admin user setup complete!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
  } catch (error) {
    console.error('Unexpected error during admin creation:', error);
  }
}

createAdminUser();