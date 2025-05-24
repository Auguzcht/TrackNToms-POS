// debug-trigger.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTrigger() {
  try {
    console.log('Checking staff table...');
    
    // Check existing staff records
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*');
    
    if (staffError) {
      console.error('Error fetching staff:', staffError);
    } else {
      console.log('Existing staff records:', staffData.length);
      staffData.forEach(s => console.log(`  - ${s.staff_id}: ${s.first_name} ${s.last_name} (${s.email})`));
    }
    
    // Check existing auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      console.log('Auth users:', authData.users.length);
      authData.users.forEach(u => console.log(`  - ${u.id}: ${u.email}`));
      
      // Check for orphaned auth users (not in staff table)
      const staffUserIds = staffData.map(s => s.user_id);
      const orphanedUsers = authData.users.filter(u => !staffUserIds.includes(u.id));
      
      if (orphanedUsers.length > 0) {
        console.log('Found orphaned auth users not in staff table:', orphanedUsers.length);
        
        // Create missing staff records
        for (const user of orphanedUsers) {
          console.log(`Creating staff record for ${user.email}...`);
          
          // Get default role_id
          const { data: roleData } = await supabase
            .from('roles')
            .select('role_id')
            .eq('role_name', 'Cashier')
            .limit(1);
          
          const roleId = roleData && roleData.length > 0 ? roleData[0].role_id : 1;
          
          // Create staff record
          const { data: newStaff, error: createError } = await supabase
            .from('staff')
            .insert({
              user_id: user.id,
              email: user.email,
              first_name: user.user_metadata?.first_name || user.email.split('@')[0],
              last_name: user.user_metadata?.last_name || 'User',
              role_id: roleId,
              status: 'Active',
              is_active: true
            })
            .select();
          
          if (createError) {
            console.error(`Error creating staff record for ${user.email}:`, createError);
          } else {
            console.log(`Created staff record:`, newStaff);
          }
        }
      }
    }
    
    // Test trigger function by examining logs
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.error('Error fetching audit logs:', logsError);
    } else if (logs.length > 0) {
      console.log('Recent audit logs:');
      logs.forEach(log => console.log(`  - ${log.action} on ${log.table_name} at ${log.changed_at}`));
    } else {
      console.log('No recent audit logs found');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugTrigger();