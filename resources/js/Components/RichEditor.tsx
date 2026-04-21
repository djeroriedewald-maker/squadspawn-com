import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

interface Props {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    error?: string | null;
}

export default function RichEditor({ value, onChange, placeholder = 'Write something…', error }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
                validate: (href) => /^https?:\/\//.test(href) || href.startsWith('mailto:'),
            }),
            Image.configure({
                HTMLAttributes: { class: 'max-w-full rounded-lg' },
            }),
            Youtube.configure({
                width: 640,
                height: 360,
                nocookie: true,
                HTMLAttributes: { class: 'max-w-full rounded-lg' },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap prose-markdown min-h-[160px] w-full rounded-b-lg border border-ink-900/10 border-t-0 bg-bone-50 px-4 py-3 text-sm text-ink-900 focus:outline-none',
            },
        },
    });

    // When a parent resets value (e.g. after submit or prop change), mirror it
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    if (!editor) return null;

    const addLink = () => {
        const prev = editor.getAttributes('link').href ?? '';
        const url = window.prompt('URL (http(s)://…)', prev);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const xsrf = (): string | null => {
        const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : null;
    };

    const handleImageFile = async (file: File) => {
        if (uploading) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('image', file);
            const token = xsrf();
            const { data } = await axios.post('/community/upload-image', form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                },
            });
            if (data?.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const addImage = () => {
        fileInputRef.current?.click();
    };

    const addYoutube = () => {
        const url = window.prompt('YouTube URL');
        if (!url) return;
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
    };

    return (
        <div className={`overflow-hidden rounded-lg border ${error ? 'border-red-500/40' : 'border-ink-900/10'}`}>
            <div className="flex flex-wrap gap-0.5 border-b border-ink-900/10 bg-white p-1">
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    label="Bold"
                    aria="Bold"
                >
                    <span className="font-bold">B</span>
                </ToolbarBtn>
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    label="Italic"
                    aria="Italic"
                >
                    <span className="italic">I</span>
                </ToolbarBtn>
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive('strike')}
                    label="Strike"
                    aria="Strikethrough"
                >
                    <span className="line-through">S</span>
                </ToolbarBtn>
                <Divider />
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    label="Heading"
                    aria="Heading 2"
                >
                    H2
                </ToolbarBtn>
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    label="Subheading"
                    aria="Heading 3"
                >
                    H3
                </ToolbarBtn>
                <Divider />
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    label="Bullet list"
                    aria="Bullet list"
                >
                    •
                </ToolbarBtn>
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    label="Numbered list"
                    aria="Numbered list"
                >
                    1.
                </ToolbarBtn>
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    label="Quote"
                    aria="Blockquote"
                >
                    ❝
                </ToolbarBtn>
                <ToolbarBtn
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    active={editor.isActive('codeBlock')}
                    label="Code block"
                    aria="Code block"
                >
                    {'</>'}
                </ToolbarBtn>
                <Divider />
                <ToolbarBtn
                    onClick={addLink}
                    active={editor.isActive('link')}
                    label="Link"
                    aria="Insert link"
                >
                    🔗
                </ToolbarBtn>
                <Divider />
                <ToolbarBtn
                    onClick={addImage}
                    active={false}
                    label={uploading ? 'Uploading…' : 'Insert image'}
                    aria="Insert image"
                >
                    {uploading ? '⏳' : '🖼️'}
                </ToolbarBtn>
                <ToolbarBtn
                    onClick={addYoutube}
                    active={false}
                    label="Insert YouTube video"
                    aria="Insert YouTube video"
                >
                    ▶
                </ToolbarBtn>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(file);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                />
            </div>

            <EditorContent editor={editor} />
        </div>
    );
}

function ToolbarBtn({
    onClick,
    active,
    label,
    aria,
    children,
}: {
    onClick: () => void;
    active: boolean;
    label: string;
    aria: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={aria}
            aria-pressed={active}
            className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-sm font-semibold transition ${
                active ? 'bg-neon-red/15 text-neon-red' : 'text-ink-700 hover:bg-ink-900/5'
            }`}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <span className="mx-0.5 h-6 w-px self-center bg-ink-900/10" />;
}
