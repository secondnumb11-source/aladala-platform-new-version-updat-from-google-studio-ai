import fs from 'fs';

let content = fs.readFileSync('src/components/NajizExtensionHub.tsx', 'utf-8');

content = content.replace(
  'hover:bg-[#D4AF37] hover:text-white border border-[#FFFFFF]/20',
  'hover:bg-[#D4AF37] hover:text-[#0b1329] border border-[#FFFFFF]/20'
);

content = content.replace(
  'w-full bg-[#D4AF37] text-white hover:bg-[#FACC15] font-black',
  'w-full bg-[#D4AF37] text-[#0b1329] hover:bg-[#FACC15] hover:text-[#0b1329] font-black'
);

// Recheck the advanced settings label and make sure the title uses #FFFFFF
content = content.replace(
  '<h3 className="font-black text-white text-xl">',
  '<h3 className="font-black text-[#FFFFFF] text-xl">'
);

fs.writeFileSync('src/components/NajizExtensionHub.tsx', content, 'utf-8');
