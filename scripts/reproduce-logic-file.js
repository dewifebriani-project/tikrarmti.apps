const fs = require('fs');

// 1. MOCK DATA FROM USER JSON
const aamUser = {
    id: "ab055d83-b9b5-4881-bdc6-1ba6fc6f3e38",
    juz_code: "30A"
};

const juz30A = {
    code: "30A",
    part: "A",
    start_page: 582,
    end_page: 591
};

// Records from JSON (A subset covering P1, P2, P3)
const aamRecords = [
    { "id": "d5cce7e3", "blok": "H4D", "normalized_blok": "H4D", "tanggal_setor": "2026-02-14" },
    { "id": "1d6ab379", "blok": "H4C", "normalized_blok": "H4C", "tanggal_setor": "2026-02-11" },
    { "id": "9ef85d7d", "blok": "H4B", "normalized_blok": "H4B", "tanggal_setor": "2026-02-09" },
    { "id": "0cb732a0", "blok": "H4A", "normalized_blok": "H4A", "tanggal_setor": "2026-02-09" },
    { "id": "95d1fb38", "blok": "H3D", "normalized_blok": "H3D", "tanggal_setor": "2026-02-07" },
    { "id": "6d16daa3", "blok": "H3A", "normalized_blok": "H3A", "tanggal_setor": "2026-02-07" },
    { "id": "c93156bf", "blok": "H3C", "normalized_blok": "H3C", "tanggal_setor": "2026-02-04" },
    { "id": "4b674364", "blok": "H3B", "normalized_blok": "H3B", "tanggal_setor": "2026-02-03" },
    { "id": "401233ae", "blok": "H2D", "normalized_blok": "H2D", "tanggal_setor": "2026-01-29" },
    { "id": "5fbe24a4", "blok": "H2C", "normalized_blok": "H2C", "tanggal_setor": "2026-01-28" },
    { "id": "96a7434e", "blok": "H2A", "normalized_blok": "H2A", "tanggal_setor": "2026-01-28" },
    { "id": "e3e9f38b", "blok": "H1D", "normalized_blok": "H1D", "tanggal_setor": "2026-01-28" },
    { "id": "195a2883", "blok": "H1C", "normalized_blok": "H1C", "tanggal_setor": "2026-01-28" },
    { "id": "d2817116", "blok": "H1B", "normalized_blok": "H1B", "tanggal_setor": "2026-01-26" },
    { "id": "bd4fc8b8", "blok": "H1A", "normalized_blok": "H1A", "tanggal_setor": "2026-01-26" },
    { "id": "f0fe33f2", "blok": "H2B", "normalized_blok": "H2B", "tanggal_setor": "2026-01-26" }
];

// 2. LOGIC FROM ROUTE.TS

function normalizeBlokCode(code) {
    if (!code) return code;
    if (/^H\d/.test(code)) return code;
    if (code.startsWith('[')) return code;
    return `H${code}`;
}

function generateAllBlocks(juzInfo) {
    const allBlocks = [];
    const parts = ['A', 'B', 'C', 'D'];
    const blockOffset = juzInfo.part === 'B' ? 10 : 0;

    for (let week = 1; week <= 10; week++) {
        const blockNumber = week + blockOffset;
        const weekStartPage = juzInfo.start_page + (week - 1);

        for (let i = 0; i < 4; i++) {
            const part = parts[i];
            const blockCode = `H${blockNumber}${part}`;
            const blockPage = Math.min(weekStartPage + i, juzInfo.end_page);

            allBlocks.push({
                block_code: blockCode,
                week_number: week,
                part,
                start_page: blockPage,
                end_page: blockPage,
                is_completed: false,
                jurnal_count: 0
            });
        }
    }
    return allBlocks;
}

function calculateWeeklyStatus(allBlocks, jurnalRecords) {
    const blockStatus = new Map();

    allBlocks.forEach(block => {
        blockStatus.set(block.block_code, { is_completed: false, jurnal_count: 0 });
    });

    jurnalRecords.forEach(record => {
        if (record.blok) {
            let blokCodes = [];
            if (typeof record.blok === 'string' && record.blok.startsWith('[')) {
                try {
                    const parsed = JSON.parse(record.blok);
                    blokCodes = Array.isArray(parsed) ? parsed : [record.blok];
                } catch {
                    blokCodes = [record.blok];
                }
            } else {
                blokCodes = [record.blok];
            }

            blokCodes.forEach(rawBlokCode => {
                const blokCode = normalizeBlokCode(rawBlokCode);
                const current = blockStatus.get(blokCode);

                if (current) {
                    current.is_completed = true;
                    current.jurnal_count += 1;
                    blockStatus.set(blokCode, current);
                }
            });
        }
    });

    const weeklyStatus = [];
    for (let week = 1; week <= 10; week++) {
        const weekBlocks = allBlocks.filter(b => b.week_number === week);
        const completedBlocks = weekBlocks.filter(b => {
            const status = blockStatus.get(b.block_code);
            return status?.is_completed || false;
        });

        weeklyStatus.push({
            week_number: week,
            total_blocks: weekBlocks.length,
            completed_blocks: completedBlocks.length,
            is_completed: completedBlocks.length === weekBlocks.length,
            blocks: weekBlocks.map(b => b.block_code)
        });
    }

    return weeklyStatus;
}

// 3. RUN TEST AND WRITE TO FILE
let output = "--- START TEST ---\n";
const allBlocks = generateAllBlocks(juz30A);
output += `Generated ${allBlocks.length} blocks for Juz 30A\n`;

const weeklyStatus = calculateWeeklyStatus(allBlocks, aamRecords);

output += "\n--- WEEKLY STATUS ---\n";
weeklyStatus.slice(0, 4).forEach(w => {
    output += `Week ${w.week_number}: ${w.completed_blocks}/${w.total_blocks} (${w.is_completed ? 'PASS' : 'FAIL'})\n`;
});

fs.writeFileSync('scripts/reproduce_output.txt', output);
console.log('Written to scripts/reproduce_output.txt');
