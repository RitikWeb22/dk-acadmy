const text = `If the function 
f(x)={■(1/x log_e⁡((1+x/a)/(1-x/b))&,x<0 @k&,x=0@(cos^2⁡x-sin^2⁡x-1)/(√(x^2+1)-1)&,x>0)┤   is continuous at x=0 , then 1/a+1/b+4/k is equal to : 
                                                              [JEE Main 2021 (Online) 31st August Morning Slot]
(1)\t-5\t(2)\t5\t(3)\t-4\t(4)\t4`;

const regex1007 = /(?:([a-zA-Z0-9_()]+\s*=\s*))?\{?\s*■\s*\(([\s\S]*?)\)\s*(?:┤|\}|(?=\n|[a-zA-Z]|$))/g;

console.log("Testing regex1007 on text...");
const t0 = Date.now();
let match;
while ((match = regex1007.exec(text)) !== null) {
  console.log(`Matched! lhs: "${match[1]}", content: "${match[2]}"`);
}
console.log(`Took ${Date.now() - t0}ms`);

