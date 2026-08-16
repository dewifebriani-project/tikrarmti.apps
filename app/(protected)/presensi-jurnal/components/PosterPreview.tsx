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
    
    // Format notes: "Juz 1A mulai dari hal X" — strip "Juz" prefix and "(Hal X-Y)" range
    const notesItems = juzOptions.map(j => {
      const codeOnly = j.name.replace(/Juz\s*/i, '').replace(/\s*\(.*?\)/, '').trim();
      return `Juz ${codeOnly} mulai dari hal ${j.start_page}`;
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
          {/* Date Area */}
          <div 
            className="absolute flex items-center justify-center text-[#5c4033] font-bold tracking-wide"
            style={{ top: '188px', left: '185px', width: '445px', height: '48px', fontSize: '18px' }}
          >
            {dateHeader}
          </div>

          {/* Notebook Lines */}
          <div 
            className="absolute flex flex-col text-[#5c4033] font-semibold leading-snug" 
            style={{ top: '370px', left: '108px', width: '415px', fontSize: '20px', gap: '9px' }}
          >
            <div className="flex gap-1.5">
              <span className="w-7 flex-shrink-0">1.</span>
              <span>Mendengarkan murottal {blockString} <span className="text-rose-600">3x</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-7 flex-shrink-0">2.</span>
              <span>Membaca {blockString} <span className="text-rose-600">40x</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-7 flex-shrink-0">3.</span>
              <span>Merekam *tanpa salah* {blockString} <span className="text-rose-600">3x</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-7 flex-shrink-0">4.</span>
              <span>Mendengarkan rekaman tadi dengan melihat mushaf, <span className="text-rose-600">jika ada yang salah maka poin 3 di ulang</span></span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-7 flex-shrink-0">5.</span>
              <span>Rabth (<span className="text-rose-600">belum ada</span>) 1x. Setor ke pasangan</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-7 flex-shrink-0">6.</span>
              <span>Muroja'ah (<span className="text-rose-600">belum ada</span>) 5x. Setor ke pasangan</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-7 flex-shrink-0">7.</span>
              <span>Tikrar ke pasangan (tanpa melihat mushaf/bil ghaib) {blockString} <span className="text-rose-600">40x</span></span>
            </div>
            
            {/* Additional List */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ marginBottom: '6px' }} className="text-[#5c4033]">Kurikulum tambahannya (optional)</div>
              <div className="flex flex-col" style={{ gap: '9px' }}>
                <div className="flex gap-1.5">
                  <span className="w-7 flex-shrink-0">1.</span>
                  <span>Baca/simak tafsir {blockString}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-7 flex-shrink-0">2.</span>
                  <span>Menulis ayat {blockString}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Area - Sticky Note */}
          <div 
            className="absolute text-[#2d4a22] font-semibold leading-snug"
            style={{ 
              top: '630px', 
              left: '535px', 
              width: '190px',
              height: '250px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              fontSize: '13.5px'
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
