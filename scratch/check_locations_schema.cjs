const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/dev/bchata/.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    const { data } = await supabase.from('locations').select('*').limit(1);
    if (data && data[0]) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample Data:', data[0]);
    }
}
run();
