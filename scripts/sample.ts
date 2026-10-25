// Print sample questions: npx vite-node scripts/sample.ts <generator-id-prefix> [n]
import { GENERATORS } from '../src/generators';
import { canonicalInputs } from '../src/generators/check';
const [prefix = '', n = '2'] = process.argv.slice(2);
for (const g of GENERATORS.filter((x) => x.id.startsWith(prefix))) {
  for (const d of g.difficulties)
    for (const f of g.formats)
      for (let s = 1; s <= Number(n); s++) {
        const q = g.generate(s * 7919, d, f);
        console.log(`--- ${g.id} ${d}/${f} seed=${s * 7919}`);
        console.log(q.prompt);
        if (q.answer.kind === 'mcq') q.answer.choices.forEach((c, i) => console.log(`  ${i === (q.answer as { correct: number }).correct ? '*' : ' '} ${c.text}`));
        console.log('  ANSWER:', q.answerDisplay, '| canonical:', canonicalInputs(q).join(' ; '));
        console.log('  H1:', q.hints[0]);
        console.log('  H2:', q.hints[1]);
        q.solution.forEach((x) => console.log('  S:', x));
      }
}
