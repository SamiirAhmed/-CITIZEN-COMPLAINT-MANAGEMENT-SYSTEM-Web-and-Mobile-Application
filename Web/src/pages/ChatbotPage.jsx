import { useEffect, useRef, useState } from 'react';

import {

  askChatbot,

  askPoliceChatbot,

  getChatbotStatus,

  getPoliceChatbotStatus,

} from '../services/chatbotService';



const ADMIN_STARTERS = [

  'How many active complaints are in the system?',

  'Immisa OB records ayaa furan?',

  'List complaint counts by status',

  'Which Banaadir districts are registered?',

];



const POLICE_STARTERS = [

  'How many OB records are assigned to me?',

  'Immisa kiis ayaa ii diyaarsan?',

  'Which cases are under investigation?',

  'Show my recent notifications',

];



const CONFIG = {

  admin: {

    title: 'Admin Chatbot',

    subtitle:

      'Ask Gemini about this portal and the live Citizen_Police_Portal database. Admin only.',

    welcome:

      'Hello. I am the SPO Admin Chatbot. Ask me about citizens, complaints, OB records, districts, SMS history, or how the portal works.',

    placeholder: 'Ask about complaints, OB records, citizens, districts…',

    getStatus: getChatbotStatus,

    ask: askChatbot,

    starters: ADMIN_STARTERS,

  },

  police: {

    title: 'Police Chatbot',

    subtitle:

      'Ask about your assigned OB records, investigations, and notifications only. Police role data.',

    welcome:

      'Hello. I am your SPO Police Assistant. I can help with your assigned OB records, investigation progress, linked complaints, and notifications. I cannot access admin or system-wide data.',

    placeholder: 'Ask about your assigned OB records, cases, or notifications…',

    getStatus: getPoliceChatbotStatus,

    ask: askPoliceChatbot,

    starters: POLICE_STARTERS,

  },

};



export default function ChatbotPage({ variant = 'admin' }) {

  const settings = CONFIG[variant] || CONFIG.admin;



  const [messages, setMessages] = useState([

    {

      id: 'welcome',

      role: 'assistant',

      content: settings.welcome,

    },

  ]);

  const [input, setInput] = useState('');

  const [sending, setSending] = useState(false);

  const [status, setStatus] = useState({ configured: false, loading: true, message: '' });

  const [error, setError] = useState('');

  const endRef = useRef(null);

  const inputRef = useRef(null);



  useEffect(() => {

    let active = true;

    const { getStatus: loadStatus } = CONFIG[variant] || CONFIG.admin;
    loadStatus()

      .then((data) => {

        if (!active) return;

        setStatus({

          configured: Boolean(data.configured),

          loading: false,

          message: data.message || '',

          model: data.model || 'gemini-3.6-flash',

        });

      })

      .catch((err) => {

        if (!active) return;

        setStatus({

          configured: false,

          loading: false,

          message: err.message || 'Unable to check chatbot status.',

        });

      });

    return () => {

      active = false;

    };

  }, [variant]);



  useEffect(() => {

    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  }, [messages, sending]);



  const sendMessage = async (rawText) => {

    const text = String(rawText || '').trim();

    if (!text || sending) return;



    setError('');

    setInput('');

    const userMessage = {

      id: `u-${Date.now()}`,

      role: 'user',

      content: text,

    };

    setMessages((prev) => [...prev, userMessage]);

    setSending(true);



    try {

      const history = [...messages, userMessage]

        .filter((item) => item.id !== 'welcome')

        .map((item) => ({ role: item.role, content: item.content }));



      const result = await settings.ask({ message: text, history });

      setMessages((prev) => [

        ...prev,

        {

          id: `a-${Date.now()}`,

          role: 'assistant',

          content: result?.reply || 'No reply received.',

        },

      ]);

      if (!status.configured) {

        setStatus((prev) => ({ ...prev, configured: true }));

      }

    } catch (err) {

      setError(err.message || 'Unable to get a reply from Gemini.');

      setMessages((prev) => [

        ...prev,

        {

          id: `e-${Date.now()}`,

          role: 'assistant',

          content:

            err.message ||

            'I could not answer that. Check GEMINI_API_KEY in Backend/.env and restart the backend.',

        },

      ]);

    } finally {

      setSending(false);

      inputRef.current?.focus();

    }

  };



  const handleSubmit = (event) => {

    event.preventDefault();

    sendMessage(input);

  };



  return (

    <div className="page-stack chatbot-page">

      <section className="panel chatbot-hero">

        <div>

          <h2>{settings.title}</h2>

          <p className="muted">{settings.subtitle}</p>

        </div>

        <div

          className={`chatbot-status ${status.configured ? 'is-ready' : 'is-pending'}`}

          aria-live="polite"

        >

          <span className="chatbot-status__dot" aria-hidden="true" />

          {status.loading

            ? 'Checking Gemini…'

            : status.configured

              ? `Ready · ${status.model || 'Gemini'}`

              : 'API key required'}

        </div>

      </section>



      {!status.loading && !status.configured ? (

        <div className="alert alert--warning">

          Paste your free Gemini API key in <code>Backend/.env</code> as{' '}

          <code>GEMINI_API_KEY=...</code>, then restart the backend. Get a key from{' '}

          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">

            Google AI Studio

          </a>

          .

          {status.message ? ` ${status.message}` : ''}

        </div>

      ) : null}



      {error ? <div className="alert alert--error">{error}</div> : null}



      <section className="panel chatbot-shell">

        <div className="chatbot-starters" aria-label="Suggested questions">

          {settings.starters.map((item) => (

            <button

              key={item}

              type="button"

              className="chatbot-starter"

              disabled={sending}

              onClick={() => sendMessage(item)}

            >

              {item}

            </button>

          ))}

        </div>



        <div className="chatbot-thread" role="log" aria-live="polite">

          {messages.map((item) => (

            <article

              key={item.id}

              className={`chatbot-bubble chatbot-bubble--${item.role}`}

            >

              <span className="chatbot-bubble__role">

                {item.role === 'user' ? 'You' : 'Assistant'}

              </span>

              <p>{item.content}</p>

            </article>

          ))}

          {sending ? (

            <article className="chatbot-bubble chatbot-bubble--assistant is-typing">

              <span className="chatbot-bubble__role">Assistant</span>

              <p>

                {variant === 'police'

                  ? 'Checking your assigned cases…'

                  : 'Thinking with live database context…'}

              </p>

            </article>

          ) : null}

          <div ref={endRef} />

        </div>



        <form className="chatbot-composer" onSubmit={handleSubmit}>

          <label className="sr-only" htmlFor="chatbot-input">

            Message

          </label>

          <textarea

            id="chatbot-input"

            ref={inputRef}

            rows={2}

            value={input}

            disabled={sending}

            placeholder={settings.placeholder}

            onChange={(event) => setInput(event.target.value)}

            onKeyDown={(event) => {

              if (event.key === 'Enter' && !event.shiftKey) {

                event.preventDefault();

                sendMessage(input);

              }

            }}

          />

          <button

            type="submit"

            className="btn btn--primary"

            disabled={sending || !input.trim()}

          >

            {sending ? 'Sending…' : 'Send'}

          </button>

        </form>

      </section>

    </div>

  );

}


