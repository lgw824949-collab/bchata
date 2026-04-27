const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/dev/bchata/.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('parties').select('*, locations(*)').limit(1).then(r => {
    console.log(JSON.stringify(r.data[0], null, 2));
    process.exit(0);
});
