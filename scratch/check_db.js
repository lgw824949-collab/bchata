import { supabase } from '../src/lib/supabase.js';

async function checkColumns() {
  const { data, error } = await supabase.from('parties').select('*').limit(1);
  if (error) {
    console.error('Error fetching parties:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in parties:', Object.keys(data[0]));
  } else {
    console.log('No data in parties to check columns.');
  }

  const { data: pData, error: pError } = await supabase.from('pending_parties').select('*').limit(1);
  if (pError) {
    console.error('Error fetching pending_parties:', pError);
  } else if (pData && pData.length > 0) {
    console.log('Columns in pending_parties:', Object.keys(pData[0]));
  } else {
    console.log('No data in pending_parties to check columns.');
  }
}

checkColumns();
