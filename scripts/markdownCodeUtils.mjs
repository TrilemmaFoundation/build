import {fromMarkdown} from 'mdast-util-from-markdown';
import {mdxjs} from 'micromark-extension-mdxjs';
import {mdxFromMarkdown} from 'mdast-util-mdx';

// The same parsing extensions used by Docusaurus's remark-mdx, without compilation.
const mdxOptions = {extensions: [mdxjs()], mdastExtensions: [mdxFromMarkdown()]};

/** Source ranges retain literal bytes rather than reserializing Markdown. */
export function markdownCodeRanges(text) {
  let tree;
  try {
    tree = fromMarkdown(text, mdxOptions);
  } catch {
    // Retain compatibility with instructional prose that is not valid MDX.
    tree = fromMarkdown(text);
  }
  const ranges = [];
  function visit(node) {
    if (node.type === 'code' || node.type === 'inlineCode') {
      let start = node.position.start.offset;
      let end = node.position.end.offset;
      const inline = node.type === 'inlineCode';
      if (!inline) {
        // Include indentation, container markers, and the closing line ending.
        const prefix = text.slice(0, start);
        start = Math.max(prefix.lastIndexOf('\r'), prefix.lastIndexOf('\n')) + 1;
        const newline = /\r\n?|\n/.exec(text.slice(end));
        end = newline ? end + newline.index + newline[0].length : text.length;
      }
      ranges.push({start, end, inline});
      return;
    }
    for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
  return ranges;
}
