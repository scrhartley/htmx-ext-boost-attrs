import packageConfig from '../package.json' with { type: 'json' }
import path from 'node:path'
import { promisify } from 'node:util'
import { access, cp, mkdir, opendir, unlink, readFile, writeFile } from 'node:fs/promises'
import UglifyJS from 'uglify-js'
import zlib from 'node:zlib'
import { createHash } from 'node:crypto'


const SRC_NAME = 'boost-attrs.js'
const DIST_DIR = 'dist'
const NAME_PREFIX = path.parse(SRC_NAME).name // without extension
const MINIFIED_NAME = `${NAME_PREFIX}.min.js`
const GZIPPED_NAME = `${NAME_PREFIX}.min.js.gz`
const ESM_NAME = `${NAME_PREFIX}.esm.js`
const VERSION = packageConfig.version


// Prepare a clean dist directory
await mkdir(DIST_DIR, { recursive: true })
const dir = await opendir(DIST_DIR)
for await (const dirent of dir) {
  if (dirent.isFile()) {
    const file = path.join(dir.path, dirent.name)
    await unlink(file)
  }
}


const source = (await readFile(SRC_NAME, { encoding: 'utf8' })).replace(/\r\n?/g, '\n')

// Regular IIFE script
await writeFile(path.join(DIST_DIR, SRC_NAME), source)

// Generate minified script
const minified = UglifyJS.minify(source).code
await writeFile(path.join(DIST_DIR, MINIFIED_NAME), minified)

// Generate gzipped (and minified) script
const gzipped = await promisify(zlib.gzip)(minified, {level: zlib.constants.Z_BEST_COMPRESSION})
await writeFile(path.join(DIST_DIR, GZIPPED_NAME), gzipped)

// Generate ESM script
const esm = "import htmx from 'htmx.org'" + '\n' + source
await writeFile(path.join(DIST_DIR, ESM_NAME), esm)


console.log()
console.log(`${NAME_PREFIX} version '${VERSION}' distribution files generated.`)
const algorithm = 'sha384'
const hash = createHash(algorithm)
hash.update(minified)
const sri = algorithm + '-' + hash.digest('base64')
console.log()
console.log(`Integrity for file '${MINIFIED_NAME}':`)
console.log(sri)
