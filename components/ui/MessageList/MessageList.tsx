import { Message } from "@/lib/types/Message";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
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

    return (
        <div ref={messageListRef} className={styles.messagelist}>
            {chatMessages.map((message, index) => {
                let icon;
                let className;

                if (message.type === "apiMessage") {
                    icon = <Image src="/noun-flowchart-4812505-FFFFFF.png" alt="AI" width="30" height="30" className={styles.boticon}
                                  priority/>;
                    className = styles.apimessage;
                } else {
                    icon = <Image src="/noun-career-4751416-FFFFFF.png" alt="Me" width="30" height="30" className={styles.usericon}
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
                                           rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            >{message.message}</ReactMarkdown>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default MessageList;
