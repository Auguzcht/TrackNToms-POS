// create-test-accounts.js - Fixed version
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of accounts to create
const accounts = [
  {
    email: 'admin@tracktoms.com',
    password: 'Admin123!',
    role: 'Admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    email: 'manager@tracktoms.com',
    password: 'Manager123!',
    role: 'Manager',
    firstName: 'Store',
    lastName: 'Manager'
  },
  {
    email: 'cashier1@tracktoms.com',
    password: 'Cashier123!',
    role: 'Cashier',
    firstName: 'Front',
    lastName: 'Cashier'
  },
  {
    email: 'inventory@tracktoms.com',
    password: 'Inventory123!',
    role: 'Inventory',
    firstName: 'Stock',
    lastName: 'Keeper'
  },
  {
    email: 'supplier@tracktoms.com',
    password: 'Supplier123!',
    role: 'Supplier',
    firstName: 'Vendor',
    lastName: 'Partner'
  }
];

async function createAccounts() {
  console.log('Creating test accounts for all roles...');
  
  // First, get all roles to make sure they exist
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*');
    
  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    return;
  }
  
  console.log(`Found ${roles.length} roles in the database:`);
  roles.forEach(r => console.log(`  - ${r.role_id}: ${r.role_name}`));
  
  // First, get all existing users
  const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  console.log(`Found ${allUsers.users.length} existing users in Auth`);
  
  // Create each account
  for (const account of accounts) {
    console.log(`\nCreating ${account.role} account: ${account.email}`);
    
    // Check if role exists
    const role = roles.find(r => r.role_name === account.role);
    if (!role) {
      console.error(`  ERROR: Role '${account.role}' not found in database. Skipping account.`);
      continue;
    }
    
    // Check if user already exists (properly this time)
    const existingUser = allUsers.users.find(u => u.email === account.email);
    
    if (existingUser) {
      console.log(`  User with email ${account.email} already exists (ID: ${existingUser.id}). Updating...`);
      
      // Update existing user
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            role: account.role,
            first_name: account.firstName,
            last_name: account.lastName
          }
        }
      );
      
      if (updateError) {
        console.error(`  Error updating user:`, updateError);
        continue;
      }
      
      console.log(`  Updated user: ${updateData.user.id}`);
      
      // Update staff record
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', existingUser.id);
        
      if (staffError) {
        console.error(`  Error fetching staff record:`, staffError);
      } else if (staffData.length === 0) {
        // Create staff record
        const { error: createStaffError } = await supabase
          .from('staff')
          .insert({
            user_id: existingUser.id,
            email: account.email,
            first_name: account.firstName,
            last_name: account.lastName,
            role_id: role.role_id,
            status: 'Active',
            is_active: true
          });
          
        if (createStaffError) {
          console.error(`  Error creating staff record:`, createStaffError);
        } else {
          console.log(`  Created staff record for ${account.email}`);
        }
      } else {
        // Update staff record
        const { error: updateStaffError } = await supabase
          .from('staff')
          .update({
            email: account.email,
            first_name: account.firstName,
            last_name: account.lastName,
            role_id: role.role_id,
            status: 'Active',
            is_active: true
          })
          .eq('user_id', existingUser.id);
          
        if (updateStaffError) {
          console.error(`  Error updating staff record:`, updateStaffError);
        } else {
          console.log(`  Updated staff record for ${account.email}`);
        }
      }
    } else {
      // Create new user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          role: account.role,
          first_name: account.firstName,
          last_name: account.lastName
        }
      });
      
      if (userError) {
        console.error(`  Error creating user:`, userError);
        continue;
      }
      
      console.log(`  Created new user: ${userData.user.id}`);
      
      // Wait for trigger to run
      console.log(`  Waiting for trigger to create staff record...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify staff record was created
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userData.user.id);
        
      if (staffError) {
        console.error(`  Error checking staff record:`, staffError);
      } else if (staffData.length === 0) {
        console.log(`  No staff record found. Creating manually...`);
        
        // Create staff record manually
        const { error: createStaffError } = await supabase
          .from('staff')
          .insert({
            user_id: userData.user.id,
            email: account.email,
            first_name: account.firstName,
            last_name: account.lastName,
            role_id: role.role_id,
            status: 'Active',
            is_active: true
          });
          
        if (createStaffError) {
          console.error(`  Error manually creating staff record:`, createStaffError);
        } else {
          console.log(`  Manually created staff record for ${account.email}`);
        }
      } else {
        console.log(`  Staff record created by trigger: ${staffData[0].staff_id}`);
      }
    }
  }
  
  // Verify all accounts were created
  console.log('\nVerifying all accounts...');
  
  const { data: allStaff, error: allStaffError } = await supabase
    .from('staff')
    .select(`
      *,
      roles (role_name)
    `);
    
  if (allStaffError) {
    console.error('Error fetching staff records:', allStaffError);
  } else {
    console.log(`Found ${allStaff.length} staff records:`);
    allStaff.forEach(s => {
      console.log(`  - ${s.staff_id}: ${s.first_name} ${s.last_name} (${s.email}) - Role: ${s.roles.role_name}`);
    });
  }
  
  // Get updated list of auth users
  const { data: updatedUsers } = await supabase.auth.admin.listUsers();
  
  console.log(`\nFound ${updatedUsers.users.length} users in Auth:`);
  updatedUsers.users.forEach(u => {
    console.log(`  - ${u.id}: ${u.email} (${u.user_metadata?.role || 'No role'})`);
  });
  
  console.log('\nAccount creation complete. You can now log in with these accounts:');
  accounts.forEach(a => console.log(`  - ${a.role}: ${a.email} / ${a.password}`));
}

createAccounts();