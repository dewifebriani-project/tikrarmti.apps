import React from 'react';

interface PosterPreviewProps {
  dateHeader: string;
  blockString: string;
  juzOptions: Array<{ name: string; start_page: number }>;
}

// Pre-define font URL at module level
const FONT_FACE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap');
`;

export const PosterPreview = React.forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ dateHeader, blockString, juzOptions }, ref) => {
    
    // Format notes: "Juz [Name] mulai dari hal [start_page]"
    const notesItems = juzOptions.map(j => {
      const cleanName = j.name.replace(/Juz/i, '').trim().split(' ')[0]; 
      return `Juz ${cleanName} mulai dari hal ${j.start_page}`;
    });

    // Split date into Masehi and Hijriah for two lines
    const dateParts = dateHeader.split(' / ');
    const masehi = dateParts[0];
    const hijriah = dateParts[1];

    return (
      <div 
        className="absolute left-[-9999px] top-[-9999px]" // Hide from screen but keep in DOM for html2canvas
        aria-hidden="true"
      >
        {/* Font injection for html2canvas */}
        <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />
        <div 
          ref={ref}
          className="relative bg-white flex-shrink-0"
          style={{
            width: '768px',
            height: '1024px',
            backgroundImage: "url('/images/kurikulum-template.jpg?v=2')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: "'Nunito', 'Comic Sans MS', 'Chalkboard SE', sans-serif"
          }}
        >
          {/* Date Area - single line again */}
          <div 
            className="absolute flex items-center justify-center text-[#5c4033] font-bold text-[14px] tracking-wide"
            style={{ top: '190px', left: '190px', width: '440px', height: '45px' }}
          >
            {dateHeader}
          </div>

          {/* Notebook Lines - Moved further down (from 340px to 380px) */}
          <div 
            className="absolute flex flex-col gap-2 text-[#5c4033] font-semibold text-[17px] leading-snug" 
            style={{ top: '380px', left: '110px', width: '410px' }}
          >
            <div className="flex gap-1.5">
              <span className="w-6 flex-shrink-0">1.</span>
              <span>Mendengarkan murottal {blockString} <span className="text-rose-600">3x</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-6 flex-shrink-0">2.</span>
              <span>Membaca {blockString} <span className="text-rose-600">40x</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-6 flex-shrink-0">3.</span>
              <span>Merekam *tanpa salah* {blockString} <span className="text-rose-600">3x</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-6 flex-shrink-0">4.</span>
              <span>Mendengarkan rekaman tadi dengan melihat mushaf, <span className="text-rose-600">jika ada yang salah maka poin 3 di ulang</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-6 flex-shrink-0">5.</span>
              <span>Rabth (<span className="text-rose-600">belum ada</span>) 1x. Setor ke pasangan</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-6 flex-shrink-0">6.</span>
              <span>Muroja'ah (<span className="text-rose-600">belum ada</span>) 5x. Setor ke pasangan</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-6 flex-shrink-0">7.</span>
              <span>Tikrar ke pasangan (tanpa melihat mushaf/bil ghaib) {blockString} <span className="text-rose-600">40x</span></span>
            </div>
            
            {/* Additional List */}
            <div className="mt-5">
              <div className="mb-2 text-[#5c4033]">Kurikulum tambahannya (optional)</div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-1.5">
                  <span className="w-6 flex-shrink-0">1.</span>
                  <span>Baca/simak tafsir {blockString}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-6 flex-shrink-0">2.</span>
                  <span>Menulis ayat {blockString}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Area - Sticky Note */}
          <div 
            className="absolute text-[#2d4a22] font-semibold text-[11.5px] leading-[1.35]"
            style={{ 
              top: '630px', 
              left: '540px', 
              width: '180px',
              height: '240px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '1px'
            }}
          >
            {notesItems.map((note, idx) => (
              <div key={idx} className="w-full">{note}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

PosterPreview.displayName = 'PosterPreview';
