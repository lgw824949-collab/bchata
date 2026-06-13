import * as Icons from 'lucide-react';
const required = ['ParkingCircle', 'Building', 'Cloud', 'Heart', 'MessageCircle', 'Star', 'Camera', 'Calendar', 'Utensils', 'Navigation'];
required.forEach(name => {
  if (Icons[name]) {
    console.log(`${name}: OK`);
  } else {
    console.log(`${name}: MISSING`);
  }
});
