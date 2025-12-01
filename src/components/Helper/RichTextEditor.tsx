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
    
    // Enhanced cleanHTML configuration for better link support
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
        a: {
          href: true,
          target: true,
          rel: true,
          title: true
        },
        img: {
          src: true,
          alt: true,
          title: true
        },
        blockquote: true
      },
      removeEmptyElements: false,
      denyTags: null
    },
    
    // Disable problematic plugins
    disablePlugins: ['pasteStorage'],
    
    // Enhanced link configuration
    link: {
      noFollowCheckbox: true,
      openInNewTabCheckbox: true,
      processPastedLink: true,
      mode: 'popup' // 'popup' or 'inline'
    },
    
    // Process paste events - simplified
    processPaste: (e: ClipboardEvent, html: string): string => {
      console.log('Paste content received, length:', html.length);
      return html; // Return original HTML without modification
    },
    
    // Enhanced Toolbar configuration with better link controls
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough',
      '|',
      'ul', 'ol', 'outdent', 'indent',
      '|', 
      'font', 'fontsize', 'brush', 'paragraph',
      '|',
      'link', // Enhanced link button
      '|',
      'image', 'file',
      '|',
      'align', 'lineHeight',
      '|',
      'undo', 'redo',
      '|',
      'preview', 'fullsize'
    ],
    
    // Toolbar adaptive configuration
    toolbarAdaptive: false,
    
    // Show toolbar always
    showTooltip: true,
    toolbarButtonSize: 'middle',
    
    // Upload configuration
    uploader: {
      insertImageAsBase64URI: true,
      imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'webp']
    },
    
    // Events for better link handling
    events: {
      afterInit: function (editor: any) {
        console.log('Jodit Editor initialized');
      },
      
      // Handle link clicks in editor
      processPaste: function (event: ClipboardEvent, html: string) {
        console.log('Processing paste with links');
        return html;
      }
    },
    
    // Style configuration
    style: {
      fontFamily: 'inherit',
      fontSize: '14px'
    },
    
    // Language
    language: 'en',
    
    // Spellcheck
    spellcheck: true,
    
    // Cursor after the link
    cursorAfterAutocomplete: true
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

  // Handle editor change
  const handleChange = (newValue: string) => {
    onChange(newValue);
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
            <div><strong>How to add links:</strong></div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              1. Select text → Click link icon → Enter URL<br/>
              2. Choose "Open in new tab" if needed
            </div>
          </div>
        </div>
      </div>

      {/* Jodit Editor */}
      <JoditEditor
        ref={editorRef}
        value={value}
        onBlur={handleChange}
        onChange={handleChange}
      />
      
      {/* Status Info */}
      <div style={{ 
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#6c757d',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <span>Characters: {value.length}</span>
        <span>Links: {(value.match(/<a\s+href=/g) || []).length} hyperlinks detected</span>
        <span>Use the link button in toolbar</span>
      </div>

      {/* Link Usage Instructions */}
      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>💡 Link Tips:</strong>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
          <li>Select text and click the <strong>link icon</strong> in toolbar</li>
          <li>Use "Open in new tab" for external links</li>
          <li>Use "No follow" for SEO optimization</li>
          <li>Links will work on your live website</li>
        </ul>
      </div>
    </div>
  );
};

export default RichTextEditor;