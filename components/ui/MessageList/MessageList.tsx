import { Message } from "@/lib/types/Message";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "@uiw/codemirror-theme-dracula";
import CodeMirror from '@uiw/react-codemirror';
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Pluggable } from "unified";
import styles from "./MessageList.module.css";

interface MessageListProps {
    chatMessages: Message[];
    loading: boolean;
}

const MessageList = ({chatMessages, loading}: MessageListProps) => {
    const messageListRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false); // New useRef to track if user scrolled up.

    useEffect(() => {
        const messageList = messageListRef.current;
        if (messageList) {
            const handleScroll = () => {
                const atBottom = messageList.scrollTop + messageList.offsetHeight >= messageList.scrollHeight - 150; // from bottom
                hasUserScrolledUp.current = !atBottom;
            };
            messageList.addEventListener('scroll', handleScroll);
            return () => {
                messageList.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    useEffect(() => {
        if (!hasUserScrolledUp.current) {
            const messageList = messageListRef.current;
            if (messageList) {
                messageList.scrollTop = messageList.scrollHeight;
            }
        }
    }, [chatMessages, loading]);

    const onCodeChange = React.useCallback((value) => {
        console.log('value:', value);
    }, []);

    return (
        <div ref={messageListRef} className={styles.messagelist}>
            {chatMessages.map((message, index) => {
                let icon;
                let className;

                if (message.type === "apiMessage") {
                    icon = <Image src="/noun-mark-1574653-FFFFFF.png" alt="AI" width="30" height="30" className={styles.boticon}
                                  priority/>;
                    className = styles.apimessage;
                } else {
                    icon = <Image src="/noun-spiral-1786305-FFFFFF.png" alt="Human" width="30" height="30" className={styles.usericon}
                                  priority/>

                    className = loading && index === chatMessages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                }
                return (
                    <div key={index} className={className}>
                        {icon}
                        <div className={styles.reactmarkdown}>
                            <ReactMarkdown linkTarget="_blank"
                                           remarkPlugins={[remarkGfm]}
                                           rehypePlugins={[rehypeRaw, rehypeSanitize({tagNames: ['code', 'pre']}) as Pluggable]}
                                           components={{
                                               code({node, inline, className, children, ...props}) {
                                                   const match = /language-(\w+)/.exec(className || '');
                                                   console.log('match:', match);
                                                   return !inline && match ? (
                                                       <CodeMirror
                                                           {...props}
                                                           value={String(children).replace(/\n$/, '')}
                                                           height="500px"
                                                           width="100%"
                                                           theme={dracula}
                                                           extensions={[javascript({jsx: true})]}
                                                           onChange={onCodeChange}
                                                       />
                                                   ) : (
                                                       <code {...props} className={className}>
                                                           {children}
                                                       </code>
                                                   )
                                               }
                                           }}
                            >{message.message}</ReactMarkdown>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default MessageList;
