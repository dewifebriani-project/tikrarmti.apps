
function generateAllBlocks(juzInfo) {
  const allBlocks = [];
  const parts = ['A', 'B', 'C', 'D'];
  const ziyadahWeeks = 10;
  const blockOffset = juzInfo.part === 'B' ? 10 : 0;

  // 1. Ziyadah Weeks (Pekan 1-10)
  for (let week = 1; week <= ziyadahWeeks; week++) {
    const blockNumber = week + blockOffset;
    const weekPage = Math.min(juzInfo.start_page + (week - 1), juzInfo.end_page);
    for (let i = 0; i < 4; i++) {
      allBlocks.push({
        block_code: `H${blockNumber}${parts[i]}`,
        week_number: week,
        part: parts[i],
        start_page: weekPage,
        end_page: weekPage,
        is_completed: false,
        jurnal_count: 0
      });
    }
  }

  // 2. Murajaah Weeks (Pekan 11-12)
  const totalPages = juzInfo.end_page - juzInfo.start_page + 1;
  const pagesPerBlock = Math.max(1, Math.ceil(totalPages / 4));

  for (let week = 11; week <= 12; week++) {
    for (let i = 0; i < 4; i++) {
      const startPage = juzInfo.start_page + (i * pagesPerBlock);
      const endPage = Math.min(startPage + pagesPerBlock - 1, juzInfo.end_page);
      
      if (startPage <= juzInfo.end_page) {
        allBlocks.push({
          block_code: `M${i + 1 + (week === 11 ? 0 : 4)}`,
          week_number: week,
          part: parts[i],
          start_page: startPage,
          end_page: endPage,
          is_completed: false,
          jurnal_count: 0
        });
      }
    }
  }
  return allBlocks;
}

const juz30A = { start_page: 582, end_page: 591, part: 'A' }; // 10 pages
const blocks = generateAllBlocks(juz30A);
console.log('Total blocks:', blocks.length);
console.log('Murajaah blocks:', blocks.filter(b => b.block_code.startsWith('M')).map(b => b.block_code));
console.log('Week 11 pages:', blocks.filter(b => b.week_number === 11).map(b => `[${b.start_page}-${b.end_page}]`));
