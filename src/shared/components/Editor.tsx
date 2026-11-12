'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// quill 은 window 를 쓰므로 서버 렌더링에서 뺀다
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

type QuillEditorProps = {
    value: string;
    maxHeight?: number;
    marginBottom?: number;
    setFunction: (html: string) => void;
}

const modules = {
    toolbar: [
        // [{ font: [] }],
        [{ size: ["small", false, "large", "huge"] }], // custom dropdown
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        // [{ color: [] }, { background: [] }], // dropdown with defaults from theme
        ["bold", "italic", "underline", "strike", "blockquote"],
        [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
        ],
        ["link", "image"],
        ["clean"],
    ],
};

const formats = [
    "font",
    "size",
    "header",
    "color",
    "background",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    //"bullet",
    "indent",
    "link",
    "image",
];

/**
 * Editor
 *
 * @param param0
 * @returns
 */
export function QuillEditor({value, maxHeight = 500, marginBottom = 50, setFunction}: QuillEditorProps): React.ReactNode {
    const [editorHtml, setEditorHtml] = useState<string>(value);

    useEffect(() => {
        setEditorHtml(value);
    }, [value]);

    useEffect(() => {
        setFunction(editorHtml);
    }, [editorHtml]);

    return (
        <ReactQuill
            theme="snow"
            value={editorHtml}
            onChange={setEditorHtml}
            modules={modules}
            formats={formats}
            style={{height: `${maxHeight}px`, marginBottom: `${marginBottom}px`}}
        />
    )
}
