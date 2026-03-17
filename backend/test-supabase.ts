import { supabase } from './src/config/supabase';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Environment loaded:', process.env.SUPABASE_URL ? 'YES' : 'NO');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').single();
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Data:', data);
    }
    
    // Test inserting a test user
    console.log('Testing insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (insertError) {
      console.error('❌ Insert test error:', insertError);
    } else {
      console.log('✅ Query test successful!');
      console.log('Profiles count:', insertData?.length || 0);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testSupabaseConnection();
