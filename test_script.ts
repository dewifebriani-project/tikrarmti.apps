const hari = 'Senin';
const pekan = 2;
const absoluteIndex = (pekan - 1) * 4 + 1; // dayNum = 1

const getFormat = (idx: number) => {
   const p = Math.ceil(idx / 4);
   const parts = ['a', 'b', 'c', 'd'];
   const pt = parts[(idx - 1) % 4];
   return `H${p}${pt}/H${p+10}${pt}`;
};

const getPartOnly = (idx: number, offset: number = 0) => {
   const p = Math.ceil(idx / 4) + offset;
   const parts = ['a', 'b', 'c', 'd'];
   const pt = parts[(idx - 1) % 4];
   return `H${p}${pt}`;
};

let murojaahString = getFormat(absoluteIndex - 1);
let rabthString = `H1a-${getPartOnly(absoluteIndex - 2, 0)}/H11a-${getPartOnly(absoluteIndex - 2, 10)}`;

console.log("absoluteIndex:", absoluteIndex);
console.log("blockString:", getFormat(absoluteIndex));
console.log("murojaahString:", murojaahString);
console.log("rabthString:", rabthString);
