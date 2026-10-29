import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const scope = "[data-fiori-root]"

// Register private color utilities instead of replacing a consumer's Tailwind
// --color-primary/--color-border definitions. Only exact theme color names are
// rewritten, so widths, font sizes and arbitrary CSS values remain unchanged.
export function namespaceFioriColorUtilities(classList, colorNames) {
  if (!colorNames.length) return classList
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const colors = [...new Set(colorNames)].sort((a, b) => b.length - a.length).map(escape).join("|")
  const prefixes = [
    "bg", "text", "border", "border-x", "border-y", "border-t", "border-r", "border-b", "border-l", "border-s", "border-e",
    "divide", "ring", "ring-offset", "outline", "shadow", "inset-shadow", "text-shadow", "fill", "stroke", "decoration", "caret", "accent", "from", "via", "to",
  ].sort((a, b) => b.length - a.length).join("|")
  const utility = new RegExp(`^(!?)(${prefixes})-(${colors})(?=$|/|!$)`)
  return classList.split(/(\s+)/).map((candidate) => {
    // Variants may contain colons inside arbitrary selectors. Rewrite only the
    // final utility, leaving those selectors and their attribute values intact.
    let squareDepth = 0
    let roundDepth = 0
    let utilityStart = 0
    for (let index = 0; index < candidate.length; index++) {
      const char = candidate[index]
      if (char === "\\") { index++; continue }
      if (char === "[") squareDepth++
      else if (char === "]") squareDepth--
      else if (char === "(") roundDepth++
      else if (char === ")") roundDepth--
      else if (char === ":" && !squareDepth && !roundDepth) utilityStart = index + 1
    }
    return candidate.slice(0, utilityStart) + candidate.slice(utilityStart)
      .replace(utility, "$1$2-fiori-$3")
  }).join("")
}

function isKeyframe(rule) {
  let parent = rule.parent
  while (parent) {
    if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) return true
    parent = parent.parent
  }
  return false
}

/** Used by registry staging for every public component stylesheet. */
export function scopeFioriCss(source, colorNames = []) {
  const ast = postcss.parse(source)
  ast.walkAtRules("apply", (rule) => {
    rule.params = namespaceFioriColorUtilities(rule.params, colorNames)
  })
  ast.walkRules((rule) => {
    if (isKeyframe(rule)) return
    const selectors = []
    selectorParser((root) => {
      root.each((selector) => {
        let text = selector.toString().trim()
        text = text
          .replace(/html\[data-density=(["'])(compact|cozy)\1\]/g, `${scope}[data-fiori-density="$2"]`)
          .replace(/:root\b/g, scope)
          .replace(/^(html|body)(?=\b|\s|$)/, scope)
        if (text === "*") selectors.push(scope)
        selectors.push(text.startsWith(scope) ? text : `${scope} ${text}`)
      })
    }).processSync(rule.selector)
    rule.selector = selectors.join(",\n")
  })
  ast.walkDecls((decl) => {
    decl.value = decl.value
      .replace(/"72-Bold(?:full)?"/g, '"Fiori 72 Bold"')
      .replace(/"72(?:full)?"/g, '"Fiori 72"')
  })
  return ast.toString()
}

export async function buildFioriFoundation({ check = false } = {}) {
  const original = postcss.parse(await fs.readFile(path.join(project, "src/index.css"), "utf8"))
  const fonts = []
  original.walkAtRules("import", (rule) => rule.remove())
  original.walkAtRules("custom-variant", (rule) => rule.remove())
  original.walkAtRules("font-face", (rule) => {
    fonts.push(rule.clone())
    rule.remove()
  })
  let themeAliases = ""
  const colorNames = []
  const scopedTheme = []
  original.walkAtRules("theme", (rule) => {
    const colors = rule.clone()
    colors.removeAll()
    rule.each((node) => {
      if (node.type !== "decl") return
      if (node.prop.startsWith("--color-")) {
        const colorName = node.prop.slice("--color-".length)
        colorNames.push(colorName)
        colors.append(node.clone({ prop: `--color-fiori-${colorName}` }))
      } else scopedTheme.push(node.clone())
    })
    themeAliases += colors.toString() + "\n"
    rule.remove()
  })
  const fontRules = []
  for (const rule of fonts) {
    const src = rule.nodes.find((node) => node.prop === "src")
    const filename = src.value.match(/\/fonts\/([^\"]+)/)?.[1]
    if (!filename) throw new Error("Unrecognized font source")
    const bytes = await fs.readFile(path.join(project, "public/fonts", filename))
    src.value = `url("data:font/woff2;base64,${bytes.toString("base64")}") format("woff2")`
    rule.nodes.find((node) => node.prop === "font-family").value = '"Fiori 72"'
    fontRules.push(rule.toString())
    if (filename === "72-Bold-full.woff2") {
      const alias = rule.clone()
      alias.nodes.find((node) => node.prop === "font-family").value = '"Fiori 72 Bold"'
      alias.nodes.find((node) => node.prop === "font-weight").value = "400"
      fontRules.push(alias.toString())
    }
  }
  const rootTheme = postcss.rule({ selector: ":root" })
  rootTheme.append(scopedTheme)
  const sap = await fs.readFile(path.join(project, "src/styles/sap-horizon.css"), "utf8")
  const stylesheet =
    "/* Generated by scripts/build-fiori-foundation.mjs. Do not edit. */\n" +
    '@import "./fiori-fonts.css";\n' +
    themeAliases +
    scopeFioriCss(sap + "\n" + rootTheme.toString() + "\n" + original.toString(), colorNames) +
    "\n"
  const fontStyles = "/* SAP 72 font binaries embedded without a remote asset dependency. See FONT-LICENSE.txt. */\n" + fontRules.join("\n") + "\n"
  for (const [filename, content] of [["fiori-scoped.css", stylesheet], ["fiori-fonts.css", fontStyles]]) {
    const output = path.join(project, "src/styles", filename)
    if (check) {
      if (await fs.readFile(output, "utf8") !== content) throw new Error(`${filename} is stale`)
    } else await fs.writeFile(output, content)
  }
  return { scopedBytes: Buffer.byteLength(stylesheet), fontBytes: Buffer.byteLength(fontStyles), colorNames }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await buildFioriFoundation({ check: process.argv.includes("--check") }))
}
