import { readFile, writeFile, mkdir, stat, realpath } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const consumerArg = process.argv[2]
if (!consumerArg) throw new Error("Usage: node scripts/registry-verify-consumer.mjs /absolute/path/to/consumer")
const consumer = path.resolve(consumerArg)
const config = JSON.parse(await readFile(path.join(consumer, "components.json"), "utf8"))
const manifest = JSON.parse(await readFile(path.join(root, "registry/source-manifest.json"), "utf8"))
const failures = []
const results = []
const options = []
for (const name of ["tsconfig.app.json", "tsconfig.json"]) {
  const file = path.join(consumer, name)
  try {
    const result = ts.readConfigFile(file, ts.sys.readFile)
    if (!result.error) options.push(ts.parseJsonConfigFileContent(result.config, ts.sys, consumer).options)
  } catch { /* consumer may have only one tsconfig */ }
}
function resolveAlias(alias) {
  for (const option of options) {
    for (const [pattern, replacements] of Object.entries(option.paths ?? {})) {
      const star = pattern.indexOf("*")
      const head = star < 0 ? pattern : pattern.slice(0, star)
      const tail = star < 0 ? "" : pattern.slice(star + 1)
      if ((star < 0 && alias === pattern) || (star >= 0 && alias.startsWith(head) && alias.endsWith(tail))) {
        const segment = star < 0 ? "" : alias.slice(head.length, tail ? -tail.length : undefined)
        const replacement = replacements[0].replace("*", segment)
        return path.resolve(option.baseUrl ?? option.pathsBasePath ?? consumer, replacement)
      }
    }
  }
  throw new Error(`Cannot resolve consumer alias ${alias}; configure TypeScript paths before installing.`)
}
function resolveTarget(target) {
  const match = target.match(/^@(components|ui|lib|hooks)\/(.*)$/)
  if (!match) return path.resolve(consumer, target)
  return path.resolve(resolveAlias(config.aliases[match[1]]), match[2])
}
function insideConsumer(file) {
  const relative = path.relative(consumer, file)
  return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative)
}
async function existingModule(candidate) {
  for (const extension of ["", ".tsx", ".ts", ".css", ".json", "/index.ts", "/index.tsx"]) {
    try {
      if ((await stat(candidate + extension)).isFile()) {
        const resolved = await realpath(candidate + extension)
        if (!insideConsumer(resolved)) failures.push(`Source import escapes independent consumer: ${resolved}`)
        return resolved
      }
    } catch { /* try the next source extension */ }
  }
  return null
}
function specifiers(file, content) {
  if (file.endsWith(".css")) return Array.from(content.matchAll(/@import\s+["']([^"']+)["']/g), match => match[1])
  if (!/\.[jt]sx?$/.test(file)) return []
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true)
  return source.statements.filter(node => ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
    .map(node => node.moduleSpecifier?.text).filter(Boolean)
}
for (const entry of manifest.sources) {
  const installed = resolveTarget(entry.target)
  if (!insideConsumer(installed)) {
    failures.push(`Install target escapes consumer: ${entry.target}`)
    continue
  }
  let content
  try { content = await readFile(installed, "utf8") }
  catch { failures.push(`Missing installed file ${path.relative(consumer, installed)}`); continue }
  const modules = specifiers(installed, content)
  for (const specifier of modules) {
    if (/value-help-models|purchase-order-sample|\/orders$|message-preview|basic-state-preview|value-help-condition-preview/.test(specifier)) {
      failures.push(`App fixture or preview import in ${installed}: ${specifier}`)
    }
    if (/^(@ui5\/|sap\.|sap-ui-core)/.test(specifier)) failures.push(`UI5 runtime import in ${installed}: ${specifier}`)
    if (specifier.startsWith(".")) {
      if (!await existingModule(path.resolve(path.dirname(installed), specifier))) failures.push(`Unresolved relative import in ${installed}: ${specifier}`)
    } else if (Object.values(config.aliases).some(alias => specifier === alias || specifier.startsWith(alias + "/"))) {
      if (!await existingModule(resolveAlias(specifier))) failures.push(`Unresolved consumer alias import in ${installed}: ${specifier}`)
    } else if (specifier.startsWith("@/")) {
      // A custom alias consumer must not retain the authoring project's import prefix.
      try {
        if (!await existingModule(resolveAlias(specifier))) failures.push(`Unresolved author alias in ${installed}: ${specifier}`)
      } catch { failures.push(`Unrewritten author alias in ${installed}: ${specifier}`) }
    }
  }
  if (entry.source.endsWith("fiori-fonts.css")) {
    if (!/data:font\/woff2;base64,/.test(content)) failures.push("Fiori fonts are not embedded")
    if (/url\(["']?https?:/.test(content)) failures.push("Fiori font CSS still requires remote font URLs")
  }
  results.push({ source: entry.source, target: entry.target, installed: path.relative(consumer, installed), imports: modules.length })
}
const packageJson = JSON.parse(await readFile(path.join(consumer, "package.json"), "utf8"))
for (const name of ["@base-ui/react", "cn", "class-variance-authority"]) {
  if (!packageJson.dependencies?.[name]) failures.push(`Missing consumer runtime dependency ${name}`)
}
const report = {
  consumer: path.basename(consumer),
  importAlias: config.aliases,
  installedSourceFiles: results.length,
  checkedSources: results,
  failures,
  boundary: "Source/import validation only; browser interaction, assistive technology and physical device results are recorded separately.",
}
await mkdir(path.join(root, "registry/evidence"), { recursive: true })
await writeFile(path.join(root, "registry/evidence/consumer-source-check.json"), JSON.stringify(report, null, 2) + "\n")
if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log(`Verified ${results.length} installed Fiori source files, consumer aliases, dependency closure and embedded fonts.`)
