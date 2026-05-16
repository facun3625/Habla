'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
};

export default function RichEditor({ value, onChange, placeholder, style }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, code: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Underline,
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'rich-editor-content' },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, label: string, title: string) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '3px 7px',
        borderRadius: 5,
        border: 'none',
        background: active ? '#6c5ce7' : 'transparent',
        color: active ? '#fff' : '#374151',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '0.82rem',
        lineHeight: 1.4,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', background: '#fff', ...style }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', 'Negrita')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', 'Cursiva')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U', 'Subrayado')}
        <div style={{ width: 1, background: '#d1d5db', margin: '0 4px' }} />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• Lista', 'Lista con viñetas')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. Lista', 'Lista numerada')}
        <div style={{ width: 1, background: '#d1d5db', margin: '0 4px' }} />
        <button
          type="button"
          title="Limpiar formato"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          style={{ padding: '3px 7px', borderRadius: 5, border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}
        >
          Limpiar
        </button>
      </div>
      {/* Editor area */}
      <div style={{ position: 'relative', minHeight: 120 }}>
        {editor.isEmpty && placeholder && (
          <div style={{ position: 'absolute', top: 10, left: 12, color: '#9ca3af', fontSize: '0.9rem', pointerEvents: 'none', userSelect: 'none' }}>
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .rich-editor-content { outline: none; padding: 10px 12px; min-height: 100px; font-size: 0.9rem; color: #1e293b; line-height: 1.6; }
        .rich-editor-content p { margin: 0 0 4px; }
        .rich-editor-content ul, .rich-editor-content ol { padding-left: 1.4em; margin: 4px 0; }
        .rich-editor-content li { margin-bottom: 2px; }
        .rich-editor-content strong { font-weight: 700; }
        .rich-editor-content em { font-style: italic; }
        .rich-editor-content u { text-decoration: underline; }
        .rich-editor-content p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
      `}</style>
    </div>
  );
}
