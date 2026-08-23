const parts = ['a', 'b', 'c', 'd', 'e'];
const getPartOnly = (idx, offset) => {
  const page = Math.floor((idx - 1) / 5) + 1 + offset;
  const part = parts[(idx - 1) % 5];
  return `H${page}${part}`;
};

const getFormat = (idx) => {
  return `${getPartOnly(idx, 0)}/${getPartOnly(idx, 10)}`;
};

for (let i = 1; i <= 5; i++) {
  let blockString = getFormat(i);
  let murojaahString = '';
  let rabthString = '';

  if (i === 1) {
    murojaahString = '(belum ada)';
    rabthString = '(belum ada)';
  } else if (i === 2) {
    murojaahString = getFormat(i - 1);
    rabthString = getFormat(i - 1);
  } else {
    murojaahString = getFormat(i - 1);
    rabthString = `H1a-${getPartOnly(i - 1, 0)}/H11a-${getPartOnly(i - 1, 10)}`;
  }
  console.log(`Hari ${i}:`);
  console.log(`  Ziyadah : ${blockString}`);
  console.log(`  Murojaah: ${murojaahString}`);
  console.log(`  Rabth   : ${rabthString}`);
}
