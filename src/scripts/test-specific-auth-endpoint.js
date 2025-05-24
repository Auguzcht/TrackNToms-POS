// test-specific-auth-endpoint.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

async function testAuthEndpoints() {
  try {
    console.log('Testing specific auth endpoints...');
    
    // Test signup endpoint with anon key
    const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test-signup@example.com',
        password: 'Password123!'
      })
    });
    
    console.log('Signup endpoint status:', signupResponse.status);
    
    // Test token endpoint
    const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'password',
        email: 'test-token@example.com',
        password: 'Password123!'
      })
    });
    
    console.log('Token endpoint status:', tokenResponse.status);
    
    // Test admin users endpoint with service key
    const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?limit=1`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    console.log('Admin users endpoint status:', adminResponse.status);
    
  } catch (error) {
    console.error('Unexpected error during endpoint tests:', error);
  }
}

testAuthEndpoints();