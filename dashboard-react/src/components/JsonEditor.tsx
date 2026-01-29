import React from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useThemeStore } from '../stores/themeStore';

interface JsonEditorProps {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    height?: string;
    placeholder?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
    value,
    onChange,
    readOnly = false,
    height = '300px',
    placeholder = '',
}) => {
    const theme = useThemeStore((state) => state.theme);

    return (
        <AceEditor
            mode="json"
            theme={theme === 'dark' ? 'tomorrow_night' : 'tomorrow'}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            name="json-editor"
            width="100%"
            height={height}
            fontSize={13}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={!readOnly}
            placeholder={placeholder}
            setOptions={{
                useWorker: false,
                showLineNumbers: true,
                tabSize: 2,
                wrap: true,
            }}
            style={{
                borderRadius: '0.5rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
        />
    );
};
