// @ts-nocheck
import * as csstree from 'css-tree';

function formatCssMinimal(css: string): string {
  return css
    // Каждое правило с новой строки
    .replace(/}/g, '}\n')
    // После точки с запятой — новая строка (кроме последней в блоке)
    .replace(/;(?![^}]*})/g, ';\n')
    // Убираем лишние пустые строки
    //.replace(/\n\s*\n/g, '\n')
    .trim();
}

export function wrapCssWithClass(css: string, className: string): string {
  if (!css || !className) return css;

  try {
    const ast = csstree.parse(css);
    
    csstree.walk(ast, (node) => {
      if (node.type === 'Rule') {
        const selectorList = node.prelude;
        const selectors: string[] = [];
        
        if (selectorList.type === 'SelectorList') {
          selectorList.children.forEach((selectorNode: any) => {
            selectors.push(csstree.generate(selectorNode));
          });
        }

        const newSelectors = selectors.map(sel => {
          const trimmed = sel.trim();
          const classRegex = new RegExp(`\\.${className}(\\s|$|,|{|>)`);
          if (classRegex.test(trimmed)) {
            return trimmed;
          }
          return `.${className} ${trimmed}`;
        });

        const newSelectorList = csstree.fromPlainObject({
          type: 'SelectorList',
          children: newSelectors.map(sel => 
            csstree.parse(sel, { context: 'selector' })
          )
        });

        node.prelude = newSelectorList;
      }
    });

    const generated = csstree.generate(ast);
    return formatCssMinimal(generated);
  } catch (e) {
    console.error('CSS parsing error:', e);
    return css;
  }
}