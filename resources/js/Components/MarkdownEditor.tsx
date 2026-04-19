import { renderMarkdown } from '@/utils/markdownPreview';
import { useMemo, useRef, useState } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    maxLength?: number;
    className?: string;
}

type Tab = 'write' | 'preview';

export default function MarkdownEditor({
    value,
    onChange,
    placeholder = 'Write something…',
    rows = 8,
    maxLength,
    className = '',
}: Props) {
    const [tab, setTab] = useState<Tab>('write');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const previewHtml = useMemo(
        () => (tab === 'preview' ? renderMarkdown(value) : ''),
        [tab, value],
    );

    function wrapSelection(before: string, after: string = before, placeholderText = '') {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = value.slice(start, end) || placeholderText;
        const next = value.slice(0, start) + before + selected + after + value.slice(end);
        onChange(next);
        // Restore selection covering the newly wrapped text
        requestAnimationFrame(() => {
            ta.focus();
            const newStart = start + before.length;
            const newEnd = newStart + selected.length;
            ta.setSelectionRange(newStart, newEnd);
        });
    }

    function prefixLines(prefix: string | ((i: number) => string)) {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = value.slice(0, start);
        const selected = value.slice(start, end) || '\n';
        const after = value.slice(end);
        const lines = selected.split('\n');
        const prefixed = lines
            .map((line, i) => (typeof prefix === 'function' ? prefix(i) : prefix) + line)
            .join('\n');
        onChange(before + prefixed + after);
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(start, start + prefixed.length);
        });
    }

    function insertLink() {
        const url = window.prompt('Link URL (paste here):');
        if (!url) return;
        wrapSelection('[', `](${url})`, 'link text');
    }

    function insertYouTube() {
        const url = window.prompt('YouTube URL (the link auto-embeds as a video):');
        if (!url) return;
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const before = value.slice(0, start);
        const after = value.slice(start);
        const insert = (before.endsWith('\n') || before === '' ? '' : '\n\n') + url + '\n\n';
        onChange(before + insert + after);
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(before.length + insert.length, before.length + insert.length);
        });
    }

    function insertImage() {
        const url = window.prompt('Image URL:');
        if (!url) return;
        wrapSelection('![', `](${url})`, 'alt text');
    }

    const ToolbarButton = ({
        title,
        onClick,
        children,
    }: {
        title: string;
        onClick: () => void;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-700 transition hover:bg-bone-100 hover:text-neon-red"
        >
            {children}
        </button>
    );

    return (
        <div className={`overflow-hidden rounded-lg border border-ink-900/10 bg-white ${className}`}>
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-ink-900/5 bg-bone-50 px-2 py-1">
                <div className="flex">
                    <button
                        type="button"
                        onClick={() => setTab('write')}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                            tab === 'write'
                                ? 'bg-white text-ink-900 shadow-sm'
                                : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                        Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('preview')}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                            tab === 'preview'
                                ? 'bg-white text-ink-900 shadow-sm'
                                : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                        Preview
                    </button>
                </div>
                {tab === 'write' && (
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton title="Bold (**text**)" onClick={() => wrapSelection('**')}>
                            <span className="font-bold">B</span>
                        </ToolbarButton>
                        <ToolbarButton title="Italic (*text*)" onClick={() => wrapSelection('*')}>
                            <span className="italic">I</span>
                        </ToolbarButton>
                        <span className="mx-1 h-5 w-px bg-ink-900/10" />
                        <ToolbarButton title="Bulleted list" onClick={() => prefixLines('- ')}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="5" cy="6" r="1.25" fill="currentColor" />
                                <circle cx="5" cy="12" r="1.25" fill="currentColor" />
                                <circle cx="5" cy="18" r="1.25" fill="currentColor" />
                                <path strokeLinecap="round" d="M10 6h10M10 12h10M10 18h10" />
                            </svg>
                        </ToolbarButton>
                        <ToolbarButton
                            title="Numbered list"
                            onClick={() => prefixLines((i) => `${i + 1}. `)}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">1.</text>
                                <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none">2.</text>
                                <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none">3.</text>
                                <path strokeLinecap="round" d="M10 6h10M10 12h10M10 18h10" />
                            </svg>
                        </ToolbarButton>
                        <ToolbarButton title="Quote" onClick={() => prefixLines('> ')}>
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 7v6h3l-1 4H6V7h1zm8 0v6h3l-1 4h-3V7h1z" />
                            </svg>
                        </ToolbarButton>
                        <span className="mx-1 h-5 w-px bg-ink-900/10" />
                        <ToolbarButton title="Link" onClick={insertLink}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                        </ToolbarButton>
                        <ToolbarButton title="Image URL" onClick={insertImage}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </ToolbarButton>
                        <ToolbarButton title="YouTube video" onClick={insertYouTube}>
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21.58 7.2a2.51 2.51 0 0 0-1.77-1.77C18.2 5 12 5 12 5s-6.2 0-7.81.43A2.51 2.51 0 0 0 2.42 7.2 26.36 26.36 0 0 0 2 12a26.36 26.36 0 0 0 .42 4.8 2.51 2.51 0 0 0 1.77 1.77C5.8 19 12 19 12 19s6.2 0 7.81-.43a2.51 2.51 0 0 0 1.77-1.77A26.36 26.36 0 0 0 22 12a26.36 26.36 0 0 0-.42-4.8ZM10 15V9l5 3Z" />
                            </svg>
                        </ToolbarButton>
                    </div>
                )}
            </div>

            {/* Body */}
            {tab === 'write' ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    maxLength={maxLength}
                    className="block w-full resize-y border-0 bg-white px-4 py-3 text-sm text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-0"
                />
            ) : (
                <div
                    className="prose-markdown min-h-[160px] px-4 py-3 text-sm text-ink-900"
                    dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-ink-500">Nothing to preview yet.</p>' }}
                />
            )}

            {/* Hint footer */}
            <div className="flex items-center justify-between border-t border-ink-900/5 bg-bone-50/60 px-3 py-1.5 text-[10px] text-ink-500">
                <span>
                    Supports <strong>**bold**</strong>, <em>*italic*</em>, `- bullets`, `1. numbered`, `&gt; quotes`, `[links](url)`, `![images](url)`, and pasted YouTube URLs.
                </span>
                {maxLength && (
                    <span>{value.length} / {maxLength}</span>
                )}
            </div>
        </div>
    );
}
