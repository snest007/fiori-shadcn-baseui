import { readFile, writeFile, mkdir, rm, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import ts from "typescript"
import { buildFioriFoundation, scopeFioriCss, namespaceFioriColorUtilities } from "./build-fiori-foundation.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const checkOnly = process.argv.includes("--check")
const stageOnly = process.argv.includes("--stage-only")
const { colorNames } = await buildFioriFoundation({ check: checkOnly })
const foundation = [
  "src/components/fiori/fiori-context.ts",
  "src/components/fiori/fiori-provider.tsx",
  "src/components/fiori/sap-icon.tsx",
  "src/lib/utils.ts",
  "src/styles/fiori-scoped.css",
  "src/styles/fiori-fonts.css",
  "src/styles/SAP-THEME-LICENSE.txt",
  "public/fonts/LICENSE.txt",
  "public/fonts/SOURCES.md",
  "public/icons/LICENSE.txt",
  "public/icons/SOURCES.md",
]
const definitions = [
  {
    name: "fiori-foundation", type: "registry:lib", title: "Fiori Foundation",
    description: "Morning Horizon scoped theme, Compact/Cozy provider, static SAP icons and embedded 72 fonts.",
    sources: foundation,
    docs: "Use FioriProvider around Fiori components. The provider imports isolated theme CSS; no UI5 control runtime or network font request is required.",
  },
  {
    name: "fiori-button", type: "registry:ui", title: "Fiori Button",
    description: "Locally adapted shadcn/Base UI Button with Fiori variants and density.",
    sources: ["src/components/ui/button.tsx"],
  },
  {
    name: "fiori-input", type: "registry:ui", title: "Fiori Input",
    description: "Locally adapted shadcn/Base UI Input with Fiori field states.",
    sources: ["src/components/ui/input.tsx"],
  },
  {
    name: "fiori-select", type: "registry:ui", title: "Fiori Select",
    description: "Locally adapted shadcn/Base UI Select, readonly behavior and phone picker.",
    sources: ["src/components/ui/select.tsx"],
  },
  {
    name: "fiori-primitives", type: "registry:lib", title: "Fiori Supporting Primitives",
    description: "Internal local shadcn/Base UI composition dependencies, installed in the Fiori namespace.",
    sources: [
      "src/components/ui/badge.tsx", "src/components/ui/checkbox.tsx", "src/components/ui/dialog.tsx",
      "src/components/ui/field.tsx", "src/components/ui/input-group.tsx", "src/components/ui/table.tsx",
      "src/components/ui/label.tsx", "src/components/ui/separator.tsx", "src/components/ui/textarea.tsx",
      "src/components/ui/alert.tsx", "src/components/ui/popover.tsx", "src/components/ui/toggle-group.tsx",
      "src/components/ui/toggle.tsx",
    ],
    internal: true,
  },
  {
    name: "fiori-message-strip", type: "registry:component", title: "Fiori MessageStrip",
    description: "Reusable semantic message strip and controlled dismissal.",
    sources: ["src/components/fiori/message-strip.tsx"],
  },
  {
    name: "fiori-value-help", type: "registry:component", title: "Fiori Value Help",
    description: "Controlled single/multiple Value Help using caller items, columns and filters.",
    sources: ["src/components/fiori/value-help.tsx", "src/components/fiori/value-help.css", "src/lib/value-help-query.ts"],
  },
  {
    name: "fiori-value-help-conditions", type: "registry:component", title: "Fiori Value Help Conditions",
    description: "Controlled conditions-only field with inclusion, exclusion and interval validation.",
    sources: [
      "src/components/fiori/value-help-conditions-field.tsx", "src/components/fiori/value-help-condition-operator.tsx",
      "src/components/fiori/value-help-conditions.css", "src/lib/value-help-conditions.ts",
    ],
  },
  {
    name: "fiori-message-popover", type: "registry:component", title: "Fiori Message Popover",
    description: "Controlled caller messages, type filters, details, back navigation and target activation.",
    sources: ["src/components/fiori/message-popover.tsx", "src/components/fiori/message-popover.css"],
  },
]
const sourceOwner = new Map()
for (const item of definitions) {
  for (const source of item.sources) {
    if (sourceOwner.has(source)) throw new Error(`Duplicate source ${source}`)
    sourceOwner.set(source, item.name)
  }
}
const sourcePackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"))
const versionFor = name => sourcePackage.dependencies[name] ?? sourcePackage.devDependencies[name]
const extensions = ["", ".ts", ".tsx", ".css", ".json", "/index.ts", "/index.tsx"]
async function isFile(file) {
  try { return (await stat(file)).isFile() } catch { return false }
}
async function resolveImport(importer, specifier) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null
  const candidate = specifier.startsWith("@/")
    ? path.join(root, "src", specifier.slice(2))
    : path.resolve(root, path.dirname(importer), specifier)
  for (const extension of extensions) {
    if (await isFile(candidate + extension)) return path.relative(root, candidate + extension).split(path.sep).join("/")
  }
  throw new Error(`Unresolved source import ${specifier} in ${importer}`)
}
function importSpecifiers(source, content) {
  if (/\.[cm]?[jt]sx?$/.test(source)) {
    const tree = ts.createSourceFile(source, content, ts.ScriptTarget.Latest, true,
      source.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const imports = []
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text)
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) {
        imports.push(node.arguments[0].text)
      }
      ts.forEachChild(node, visit)
    }
    visit(tree)
    return imports
  }
  if (source.endsWith(".css")) return Array.from(content.matchAll(/@import\s+["']([^"']+)["']/g), match => match[1])
  return []
}
function externalPackage(specifier) {
  if (specifier.startsWith("node:") || specifier.startsWith("@/") || specifier.startsWith(".")) return null
  return specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]
}
function targetFor(source) {
  if (source.startsWith("src/components/ui/")) return "@components/fiori/ui/" + source.slice("src/components/ui/".length)
  if (source.startsWith("src/components/fiori/")) return "@components/fiori/" + source.slice("src/components/fiori/".length)
  if (source.startsWith("src/lib/")) return "@lib/fiori/" + source.slice("src/lib/".length)
  if (source.startsWith("src/styles/")) return "@lib/fiori/styles/" + source.slice("src/styles/".length)
  if (source.startsWith("public/fonts/")) return "@lib/fiori/styles/FONT-" + path.basename(source)
  if (source.startsWith("public/icons/")) return "@lib/fiori/licenses/icons-" + path.basename(source)
  throw new Error(`No target mapping for ${source}`)
}
function stageFor(source) {
  return "registry/fiori/" + targetFor(source).replace(/^@(components|lib)\//, "$1/")
}
function fileType(source) {
  if (/\.(css|txt|md|json)$/.test(source)) return "registry:file"
  if (source.startsWith("src/components/ui/")) return "registry:ui"
  if (source.startsWith("src/components/fiori/")) return "registry:component"
  return "registry:lib"
}
function namespaceSourceColors(source, content) {
  if (!/\.[cm]?[jt]sx?$/.test(source)) return content
  const tree = ts.createSourceFile(source, content, ts.ScriptTarget.Latest, true,
    source.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const replacements = []
  function visit(node) {
    let start
    let end
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      start = node.getStart(tree) + 1
      end = node.end - 1
    } else if (node.kind === ts.SyntaxKind.TemplateHead || node.kind === ts.SyntaxKind.TemplateMiddle) {
      start = node.getStart(tree) + 1
      end = node.end - 2
    } else if (node.kind === ts.SyntaxKind.TemplateTail) {
      start = node.getStart(tree) + 1
      end = node.end - 1
    }
    if (start !== undefined) {
      const original = content.slice(start, end)
      const namespaced = namespaceFioriColorUtilities(original, colorNames)
      if (namespaced !== original) replacements.push({ start, end, content: namespaced })
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  let result = content
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, replacement.start) + replacement.content + result.slice(replacement.end)
  }
  return result
}
function rewrite(source, content) {
  const styled = source.startsWith("src/components/fiori/") && source.endsWith(".css")
    ? scopeFioriCss(content, colorNames)
    : namespaceSourceColors(source, content)
  return styled
    .replaceAll("@/components/ui/", "@/components/fiori/ui/")
    .replaceAll("@/lib/utils", "@/lib/fiori/utils")
    .replaceAll("@/lib/value-help-query", "@/lib/fiori/value-help-query")
    .replaceAll("@/lib/value-help-conditions", "@/lib/fiori/value-help-conditions")
    .replaceAll("@/styles/fiori-scoped.css", "@/lib/fiori/styles/fiori-scoped.css")
    .replaceAll("@/styles/fiori-fonts.css", "@/lib/fiori/styles/fiori-fonts.css")
}
function sha(content) { return createHash("sha256").update(content).digest("hex") }
const expectedSources = []
const registryItems = []
for (const definition of definitions) {
  const otherItems = new Set(definition.name === "fiori-foundation" ? [] : ["fiori-foundation"])
  const npmDependencies = new Set()
  const files = []
  for (const source of definition.sources) {
    const content = await readFile(path.join(root, source), "utf8")
    for (const specifier of importSpecifiers(source, content)) {
      const local = await resolveImport(source, specifier)
      if (local) {
        const owner = sourceOwner.get(local)
        if (!owner) throw new Error(`Missing registry dependency closure: ${source} -> ${local}`)
        if (owner !== definition.name) otherItems.add(owner)
      } else {
        const dependency = externalPackage(specifier)
        if (dependency && !["react", "react-dom"].includes(dependency)) {
          const version = versionFor(dependency)
          if (!version) throw new Error(`Undeclared npm dependency ${dependency} from ${source}`)
          npmDependencies.add(`${dependency}@${version}`)
        }
      }
    }
    const staged = rewrite(source, content)
    const stage = stageFor(source)
    const target = targetFor(source)
    files.push({ path: stage, type: fileType(source), target })
    expectedSources.push({ source, stage, target, sha256: sha(staged), bytes: Buffer.byteLength(staged) })
    if (checkOnly) {
      const actual = await readFile(path.join(root, stage), "utf8")
      if (actual !== staged) throw new Error(`Stale staged source ${stage}; run registry:build`)
    } else {
      await mkdir(path.dirname(path.join(root, stage)), { recursive: true })
      await writeFile(path.join(root, stage), staged)
    }
  }
  registryItems.push({
    name: definition.name, type: definition.type, title: definition.title, description: definition.description,
    ...(npmDependencies.size ? { dependencies: [...npmDependencies].sort() } : {}),
    ...(otherItems.size ? { registryDependencies: [...otherItems].sort().map(name => `@fiori/${name}`) } : {}),
    files,
    meta: { source: "Fiori Design Lab", baseline: "SAPUI5 1.151.0 / Morning Horizon", ...(definition.internal ? { internal: true } : {}) },
    ...(definition.docs ? { docs: definition.docs } : {}),
  })
}
registryItems.push({
  name: "fiori-kit", type: "registry:item", title: "Fiori Pilot Kit",
  description: "First-batch public Fiori source components and their scoped foundation.",
  registryDependencies: definitions.filter(item => !item.internal).map(item => `@fiori/${item.name}`),
  docs: "Import FioriProvider from your components/fiori/fiori-provider and compose installed Fiori components inside it. React 19 and Tailwind 4 are required. Full API contracts are supplied in the authoring project docs.",
})
const itemNames = new Set(registryItems.map(item => item.name))
const visiting = new Set()
const visited = new Set()
function visitItem(name) {
  if (visited.has(name)) return
  if (visiting.has(name)) throw new Error(`Circular local registry dependency ${name}`)
  visiting.add(name)
  const item = registryItems.find(candidate => candidate.name === name)
  for (const address of item.registryDependencies ?? []) {
    if (!address.startsWith("@fiori/")) throw new Error(`Non-local registry dependency ${address}`)
    const dependency = address.slice("@fiori/".length)
    if (!itemNames.has(dependency)) throw new Error(`Unknown local registry dependency ${address}`)
    visitItem(dependency)
  }
  visiting.delete(name)
  visited.add(name)
}
for (const item of registryItems) visitItem(item.name)
const registry = { $schema: "https://ui.shadcn.com/schema/registry.json", name: "fiori-design-lab", homepage: "http://127.0.0.1:4178/", items: registryItems }
const registryText = JSON.stringify(registry, null, 2) + "\n"
const manifestText = JSON.stringify({ generatedBy: "scripts/registry-build.mjs", sources: expectedSources }, null, 2) + "\n"
if (checkOnly) {
  if (await readFile(path.join(root, "registry.json"), "utf8") !== registryText) throw new Error("Stale registry.json")
  if (await readFile(path.join(root, "registry/source-manifest.json"), "utf8") !== manifestText) throw new Error("Stale registry/source-manifest.json")
} else {
  await mkdir(path.join(root, "registry"), { recursive: true })
  await writeFile(path.join(root, "registry.json"), registryText)
  await writeFile(path.join(root, "registry/source-manifest.json"), manifestText)
}
if (!checkOnly && !stageOnly) {
  await rm(path.join(root, "public/r"), { recursive: true, force: true })
  const result = spawnSync("npx", ["shadcn@latest", "build", "registry.json", "--output", "public/r"], { cwd: root, stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
if (!stageOnly) {
  for (const item of registryItems) {
    const built = JSON.parse(await readFile(path.join(root, "public/r", `${item.name}.json`), "utf8"))
    if (built.name !== item.name) throw new Error(`Built item mismatch ${item.name}`)
    for (const file of item.files ?? []) {
      const builtFile = built.files?.find(candidate => candidate.path === file.path)
      const staged = await readFile(path.join(root, file.path), "utf8")
      if (!builtFile || builtFile.content !== staged || builtFile.target !== file.target) throw new Error(`Built source mismatch ${item.name}: ${file.path}`)
    }
  }
}
console.log(`Verified ${registryItems.length} local registry items and ${expectedSources.length} source files${stageOnly ? " (staged only)" : " with built payloads"}.`)
