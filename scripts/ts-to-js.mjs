import { readFile, writeFile } from 'node:fs/promises'
import tsBlankSpace from "ts-blank-space"
import process from "node:process"

export function stripTypes(source) {
  return tsBlankSpace(source)
    .replace(/ +(?=[),])/g, '')      // "   ," and "   )"
    .replace(/(?<=\) ) +(?={)/g, '') // ")   {"
    .replace(/(?<= ) +(?==)/g, '')   // "   ="
    .replace(/ +$/gm, '')   // trailing line spaces
}

const ranAsScript = process.argv[1] === import.meta.filename
if (ranAsScript && process.argv.length === 4) {
  const INPUT_TS = process.argv[2]
  const OUTPUT_JS = process.argv[3]
  
  const ts = await readFile(INPUT_TS, { encoding: 'utf8' })
  const js = stripTypes(ts)
  await writeFile(OUTPUT_JS, js)
}
