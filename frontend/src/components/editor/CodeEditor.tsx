import React, { useRef } from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
  onRun?: () => void;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = "python",
  height = "100%",
  readOnly = false,
  onRun,
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco: Monaco) => {
    editorRef.current = editor;

    // Define PyQuest Dark Theme
    monaco.editor.defineTheme("pyquest-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "c084fc", fontStyle: "bold" },
        { token: "keyword.python", foreground: "c084fc", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "string.python", foreground: "34d399" },
        { token: "number", foreground: "fb923c" },
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "type", foreground: "38bdf8" },
        { token: "identifier", foreground: "f1f5f9" },
        { token: "delimiter", foreground: "94a3b8" },
      ],
      colors: {
        "editor.background": "#070a14",
        "editor.foreground": "#f1f5f9",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#818cf8",
        "editor.selectionBackground": "#312e8166",
        "editor.inactiveSelectionBackground": "#1e1b4b44",
        "editorCursor.foreground": "#a5b4fc",
        "editorWhitespace.foreground": "#1e293b",
        "editorIndentGuide.background": "#1e293b55",
        "editorIndentGuide.activeBackground": "#4f46e588",
        "editorBracketMatch.background": "#312e8188",
        "editorBracketMatch.border": "#6366f1",
      },
    });

    monaco.editor.setTheme("pyquest-dark");

    // Register Python snippet completions if not already registered
    if (language === "python") {
      try {
        monaco.languages.registerCompletionItemProvider("python", {
          provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            const suggestions = [
              {
                label: "input_split",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "${1:a}, ${2:b} = map(int, input().split())",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Read space-separated integers from input",
                range,
              },
              {
                label: "input_int",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "${1:n} = int(input().strip())",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Read a single integer from input",
                range,
              },
              {
                label: "input_list",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "${1:arr} = list(map(int, input().split()))",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Read a list of integers from input",
                range,
              },
              {
                label: "main_func",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "def main():\n    ${1:pass}\n\nif __name__ == '__main__':\n    main()",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Boilerplate main function",
                range,
              },
              {
                label: "for_range",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "for ${1:i} in range(${2:n}):\n    ${3:pass}",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "For loop with range",
                range,
              },
              {
                label: "print",
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: "print(${1:})",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Built-in print function",
                range,
              },
              {
                label: "sys_stdin",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "import sys\ninput = sys.stdin.read",
                documentation: "Fast I/O with sys.stdin",
                range,
              },
            ];

            return { suggestions };
          },
        });
      } catch {
        // Provider may already be registered
      }
    }

    // Ctrl+Enter or Cmd+Enter to execute code
    if (onRun) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun();
      });
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#070a14] rounded-xl border border-white/5 shadow-inner">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly,
          fontSize: 13.5,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          padding: { top: 12, bottom: 12 },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          wordWrap: "off",
        }}
        loading={
          <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-[#070a14] text-slate-400 font-mono text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>กำลังเตรียมห้องแล็บโค้ด...</span>
            </div>
          </div>
        }
      />
    </div>
  );
};
