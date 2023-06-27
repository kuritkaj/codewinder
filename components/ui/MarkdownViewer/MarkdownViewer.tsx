import CodeEditor from "@/components/ui/CodeEditor";
import styles from "@/components/ui/MarkdownViewer/MarkdownViewer.module.css";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Pluggable } from "unified";

interface MarkdownViewerProps {
    markdown: string;
}

const MarkdownViewer = ({ markdown }: MarkdownViewerProps) => {
    return (
        <div className={styles.reactmarkdown}>
            <ReactMarkdown linkTarget="_blank"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize({tagNames: ['code', 'pre']}) as Pluggable]}
                components={{
                    code({inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <CodeEditor>
                               {children}
                            </CodeEditor>
                        ) : (
                            <code {...props} className={className}>
                               {children}
                            </code>
                        )
                    }
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}

export default React.memo(MarkdownViewer);