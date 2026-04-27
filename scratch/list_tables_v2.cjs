const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://biwziyyklaycbjrnitem.supabase.co';
const supabaseAnonKey = 'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables'); // If rpc exists
  if (error) {
     // fallback: try to select from common tables to see what exists
     const tables = ['parties', 'pending_parties', 'classes_info', 'locations', 'activity_logs', 'app_traffic_logs', 'users'];
     for (const t of tables) {
       const { error: e } = await supabase.from(t).select('count').limit(1);
       if (!e) console.log(`Table exists: ${t}`);
       else console.log(`Table missing/error: ${t} (${e.message})`);
     }
  } else {
    console.log('Tables:', data);
  }
}

listTables();
