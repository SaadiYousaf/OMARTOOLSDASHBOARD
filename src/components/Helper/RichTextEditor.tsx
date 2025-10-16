// components/RichTextEditor.tsx
import React, { useRef } from 'react';
import JoditEditor from 'jodit-react';

interface RichTextEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Start typing...' 
}) => {
  const editorRef = useRef<any>(null);

  const config = {
    readonly: false,
    placeholder: placeholder,
    height: 400,
    width: '100%',
    
    // Safe mode disabled to allow pasting
    safeMode: false,
    
    // Proper cleanHTML configuration
    cleanHTML: {
      allowTags: {
        p: true,
        br: true,
        strong: true,
        em: true,
        u: true,
        ul: true,
        ol: true,
        li: true,
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        div: true,
        span: true,
        table: true,
        tr: true,
        td: true,
        th: true,
        thead: true,
        tbody: true,
        a: true,
        img: true,
        blockquote: true
      },
      removeEmptyElements: false,
      denyTags: null
    },
    
    // Disable problematic plugins
    disablePlugins: ['pasteStorage'],
    
    // Process paste events - simplified
    processPaste: (e: ClipboardEvent, html: string): string => {
      console.log('Paste content received, length:', html.length);
      return html; // Return original HTML without modification
    },
    
    // Toolbar configuration
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough',
      '|',
      'ul', 'ol',
      '|', 
      'outdent', 'indent',
      '|',
      'font', 'fontsize',
      '|',
      'link', 'image',
      '|',
      'align',
      '|',
      'undo', 'redo',
      '|',
      'preview'
    ],
    
    uploader: {
      insertImageAsBase64URI: true
    },
    
    style: {
      fontFamily: 'inherit',
      fontSize: '14px'
    }
  };

  // Force paste method as backup
  const forcePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (editorRef.current) {
        const editor = editorRef.current;
        const currentHtml = editor.value;
        
        // Convert plain text to simple HTML
        const paragraphs = text
          .split('\n')
          .filter(line => line.trim())
          .map(line => `<p>${line}</p>`)
          .join('');
        
        const newHtml = currentHtml + paragraphs;
        editor.value = newHtml;
        onChange(newHtml);
        
        // Show success message
        alert(`Successfully pasted ${text.length} characters!`);
      }
    } catch (error) {
      console.error('Paste failed:', error);
      alert('Could not read from clipboard. Please ensure you have text copied and try again.');
    }
  };

  return (
    <div className="rich-text-editor">
      {/* Paste Control Section */}
      <div style={{
        padding: '12px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={forcePaste}
            style={{
              padding: '10px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📋 Click Here to Paste Your Text
          </button>
          
          <div style={{ fontSize: '13px', color: '#666' }}>
            <div><strong>Or try:</strong> Ctrl+V in the editor below</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Use the button above if direct pasting doesn't work
            </div>
          </div>
        </div>
      </div>

      {/* Jodit Editor */}
      <JoditEditor
        ref={editorRef}
        value={value}
        onBlur={(newValue: string) => onChange(newValue)}
      />
      
      {/* Status Info */}
      <div style={{ 
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#6c757d',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Characters: {value.length}</span>
        <span>Paste using the green button above</span>
      </div>
    </div>
  );
};

export default RichTextEditor;