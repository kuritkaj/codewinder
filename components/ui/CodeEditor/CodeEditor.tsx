import { javascript } from "@codemirror/lang-javascript";
import { ViewUpdate } from "@codemirror/view";
import { dracula } from "@uiw/codemirror-theme-dracula";
import CodeMirror from "@uiw/react-codemirror";
import React, { useCallback, useState } from "react";

interface CodeEditorProps {
    children: React.ReactNode;
}

const CodeEditor = ({children}: CodeEditorProps) => {

    const initialCode = String(children).replace(/\n$/, '');
    const [code, setCode] = useState<string>(initialCode);

    const onUpdate = useCallback((v: ViewUpdate) => {
        if (v.docChanged) setCode(v.state.doc.toString());
    }, []);

    return (
        <CodeMirror
            value={code}
            readOnly={false}
            maxHeight="500px"
            width="100%"
            theme={dracula}
            extensions={[javascript({jsx: true})]}
            onUpdate={onUpdate}
        />
    );
}

export default React.memo(CodeEditor);