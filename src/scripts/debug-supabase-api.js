// debug-supabase-api.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

async function debugSupabaseAPI() {
  try {
    console.log('Testing Supabase API connectivity...');
    
    // 1. Test basic connectivity
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey
      }
    });
    
    console.log('Health check status:', healthResponse.status);
    
    // 2. Test auth API
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    console.log('Auth API status:', authResponse.status);
    
    // 3. Try reading the staff table
    const staffResponse = await fetch(`${supabaseUrl}/rest/v1/staff?select=*&limit=1`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    console.log('Staff table read status:', staffResponse.status);
    
    // 4. Try listing users
    const usersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    console.log('List users status:', usersResponse.status);
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log('Users count:', users.users ? users.users.length : 0);
    } else {
      const errorText = await usersResponse.text();
      console.error('List users error:', errorText);
    }
    
  } catch (error) {
    console.error('Unexpected error during API tests:', error);
  }
}

debugSupabaseAPI();