const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://biwziyyklaycbjrnitem.supabase.co',
  'sb_publishable_TSfuOakU5BxoKeJrIoRDrw_kd6pz-k1'
);

// We need the secret key to perform updates/uploads if RLS is enabled, 
// but since it's a dev environment, let's hope the anon key works for public buckets or I can use the service role if provided.
// Actually, I only have the anon key. Let's try.

async function fixInstructor() {
  const imagePath = 'C:\\Users\\^^\\.gemini\\antigravity\\brain\\1dbccb7e-a34e-45b1-9f7c-f25409a65e28\\namgoong_claire_poster_1778316439577.png';
  const fileBuffer = fs.readFileSync(imagePath);
  const fileName = `instructors/namgoong_claire_${Date.now()}.png`;

  console.log('Uploading to Supabase...');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('posters')
    .upload(fileName, fileBuffer, { contentType: 'image/png' });

  if (uploadError) {
    console.error('Upload Error:', uploadError);
    return;
  }

  const { data: urlData } = supabase.storage
    .from('posters')
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;
  console.log('Public URL:', publicUrl);

  console.log('Updating Database...');
  const { error: updateError } = await supabase
    .from('instructors')
    .update({ photo_url: publicUrl })
    .eq('name', '남궁건 & 클레어');

  if (updateError) {
    console.error('Update Error:', updateError);
  } else {
    console.log('Successfully fixed Namgoong Gun & Claire profile!');
  }
}

fixInstructor();
