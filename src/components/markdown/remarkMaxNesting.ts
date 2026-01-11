import { visit } from 'unist-util-visit'

export default function remarkMaxNesting(maxDepth = 6) {
  return () => (tree) => {
    function clamp(node, depth) {
      if (depth > maxDepth) {
        node.type = 'paragraph'
        node.children = [{ type: 'text', value: '…(collapsed deep nesting)…' }]
        return
      }

      if (!node.children) return

      for (const child of node.children) {
        if (child.type === 'list' || child.type === 'listItem' || child.type === 'blockquote') {
          clamp(child, depth + 1)
        }
      }
    }

    visit(tree, (node) => {
      if (node.type === 'list' || node.type === 'blockquote') {
        clamp(node, 1)
      }
    })
  }
}
