
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJoinedUnique() {
  const { data, error } = await supabase
    .from('parties')
    .select('address, locations(regions(name))');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const regionNames = new Set();
  const addresses = new Set();

  data.forEach(p => {
    if (p.address) addresses.add(p.address);
    const loc = Array.isArray(p.locations) ? p.locations[0] : p.locations;
    const reg = loc?.regions ? (Array.isArray(loc.regions) ? loc.regions[0] : loc.regions) : null;
    if (reg?.name) regionNames.add(reg.name);
  });

  console.log('\n--- regions.name Unique Values (Source for broadRegion/cityName) ---');
  console.log([...regionNames].sort().join(', '));

  console.log('\n--- parties.address Unique Values (Partial Sample) ---');
  const sortedAddresses = [...addresses].sort();
  console.log(sortedAddresses.slice(0, 50).join('\n'));
  console.log(`\n... and ${sortedAddresses.length - 50} more unique addresses.`);
}

checkJoinedUnique();
