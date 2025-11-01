import React from 'react';
import Editor from '@monaco-editor/react';
import RemixIcon from './RemixIcon';

const MonacoEditor = ({ value, onChange, placeholder }) => {
  console.log('🔧 MonacoEditor component rendered');

  const handleEditorDidMount = (editor, monaco) => {
    console.log('✅ Monaco Editor mounted successfully');
  };

  const handleEditorChange = (newValue) => {
    console.log('📝 Monaco Editor content changed:', newValue?.length || 0, 'characters');
    if (onChange) {
      onChange(newValue || '');
    }
  };

  const handleBeforeMount = (monaco) => {
    console.log('🔧 Monaco Editor before mount - monaco available:', !!monaco);
  };

  return (
    <div className="monaco-editor-container">
      <Editor
        height="100%"
        language="html"
        theme="vs-dark"
        defaultValue="<!-- Start typing HTML here -->"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        beforeMount={handleBeforeMount}
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          lineNumbersMinChars: 2,
          automaticLayout: true,
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 10, bottom: 10 },
          lineHeight: 20,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
        }}
        loading={
          <div className="monaco-loading">
            <RemixIcon name="ri-loader-4-line" size="20px" />
            <span>Loading Monaco Editor...</span>
          </div>
        }
      />
    </div>
  );
};

export default MonacoEditor;