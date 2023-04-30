import { useState, useRef, useEffect, useMemo } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import CircularProgress from '@mui/material/CircularProgress';
import TextareaAutosize from 'react-textarea-autosize';
import remarkGfm from "remark-gfm";

type Message = {
  type: "apiMessage" | "userMessage";
  message: string;
  isStreaming?: boolean;
}

const Page = () => {
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageState, setMessageState] = useState<{ messages: Message[], pending?: string, context: [string, string][] }>({
    messages: [{
      "message": "Hi there! How can I help?",
      "type": "apiMessage"
    }],
    context: []
  });

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messageState.messages, messageState.pending]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  const handleError = () => {
    setMessageState(state => ({
      ...state,
      messages: [...state.messages, {
        type: "apiMessage",
        message: "Oops! There seems to be an error. Please try again.",
      }],
      pending: undefined
    }));

    setLoading(false);
    setUserInput("");
  }

  // Handle form submission
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const objective = userInput.trim();
    if (objective === "") {
      return;
    }

    setMessageState(state => ({
      ...state,
      messages: [...state.messages, {
        type: "userMessage",
        message: objective
      }],
      pending: undefined
    }));

    setLoading(true);
    setUserInput("");
    setMessageState(state => ({ ...state, pending: "" }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objective,
        context: messageState.context
      })
    });

    if (!response.ok) {
      handleError();
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) return;

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const data = decoder.decode(value, { stream: true });

      // clear the textarea if the data contains {clear}
      if (data.trim().includes("{clear}")) {
        setMessageState(state => ({
          ...state,
          pending: undefined,
        }));
      }

      // if the data contains {clear}, just output the string after that phrase.
      const chunk = data.split("{clear}").pop();
      setMessageState(state => ({
        ...state,
        pending: (state.pending ?? "") + chunk,
      }));
    }

    setMessageState(state => ({
      context: [...state.context, [objective, state.pending ?? ""]],
      messages: [...state.messages, {
        type: "apiMessage",
        message: state.pending ?? "",
      }],
      pending: undefined
    }));

    setLoading(false);
    setUserInput("");
  }

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e: any) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput) {
        handleSubmit(e).then();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const chatMessages = useMemo(() => {
    return [...messageState.messages, ...(messageState.pending ? [{ type: "apiMessage", message: messageState.pending }] : [])];
  }, [messageState.messages, messageState.pending]);

  return (
    <>
      <Head>
        <title>Codewinder</title>
        <meta name="description" content="Your intelligent personal assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className = {styles.navlogo}>
          <Link href="/">Codewinder</Link>
        </div>
        <div className = {styles.navlinks}>
          <a
            href="https://js.langchain.com/docs/"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
          <a
            href="https://github.com/hwchase17/langchainjs"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {chatMessages.map((message, index) => {
              let icon;
              let className;

              if (message.type === "apiMessage") {
                icon = <Image src="/parroticon.png" alt="AI" width="30" height="30" className={styles.boticon} priority />;
                className = styles.apimessage;
              } else {
                icon = <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority />

                // The latest message sent by the user will be animated while waiting for a response
                className = loading && index === chatMessages.length - 1
                  ? styles.usermessagewaiting
                  : styles.usermessage;
              }
              return (
                  <div key={index} className={className}>
                    {icon}
                    <div className = {styles.markdownanswer}>
                      <ReactMarkdown linkTarget="_blank" remarkPlugins={[remarkGfm]}>{message.message}</ReactMarkdown>
                    </div>
                  </div>
              )
            })}
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <TextareaAutosize
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                minRows={1}
                maxRows={5}
                id="userInput" 
                name="userInput" 
                placeholder={loading? "Waiting for response..." : "Type your question..."}  
                value={userInput} 
                onChange={e => setUserInput(e.target.value)} 
                className={styles.textarea}
              />
              <button 
                type="submit" 
                disabled = {loading}
                className = {styles.generatebutton}
              >
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <CircularProgress color="inherit" size={20}/>
                  </div>
                ) : (
                  // Send icon SVG in input field
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
          <div className = {styles.footer}>
            <p>Powered by <a href="https://github.com/hwchase17/langchain" target="_blank" rel="noreferrer">
                LangChain
              </a>.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

export default Page;