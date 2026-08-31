import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * TrailingNode — always keeps an empty paragraph at the end of the document.
 *
 * Without this, inserting a block-level atom (video, image) at the end of the
 * document leaves no text node for the cursor to land in. The user clicks below
 * the media and nothing happens because there is literally no node there.
 */
export const TrailingNode = Extension.create({
  name: 'trailingNode',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('trailingNode'),

        appendTransaction: (transactions, _oldState, newState) => {
          // Only act when the document actually changed
          if (!transactions.some(t => t.docChanged)) return null;

          const { doc, tr, schema } = newState;
          const paragraphType = schema.nodes.paragraph;
          if (!paragraphType) return null;

          const lastNode = doc.lastChild;

          // Already ends with an empty paragraph — nothing to do
          if (
            lastNode &&
            lastNode.type === paragraphType &&
            lastNode.childCount === 0
          ) {
            return null;
          }

          // Insert an empty paragraph at the very end of the document
          return tr.insert(doc.content.size, paragraphType.create());
        },
      }),
    ];
  },
});
