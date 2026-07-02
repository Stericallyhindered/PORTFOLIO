export function serialize(content: any): string {
  if (!content) return ''
  if (typeof content === 'string') return content

  try {
    if (content.root?.children) {
      return content.root.children
        .map((node: any) => {
          if (node.type === 'text') {
            let text = node.text || ''
            if (node.format === 'bold') text = `<strong>${text}</strong>`
            if (node.format === 'italic') text = `<em>${text}</em>`
            if (node.format === 'underline') text = `<u>${text}</u>`
            return text
          }
          if (node.type === 'link') {
            const url = node.fields?.url || '#'
            const linkText =
              node.children
                ?.map((child: any) => serialize({ root: { children: [child] } }))
                .join('') || ''
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
          }
          if (node.type === 'paragraph') {
            return `<p>${node.children ? serialize({ root: { children: node.children } }) : ''}</p>`
          }
          if (node.children) {
            return serialize({ root: { children: node.children } })
          }
          return ''
        })
        .join('')
    }
  } catch (error) {
    console.error('Error serializing Lexical content:', error)
  }

  return ''
}
