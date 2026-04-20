import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

// Get key at: https://console.groq.com  (sign in with Google/GitHub)
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert Interview Preparation Assistant for a student platform called React App.
Your job is to help engineering students prepare for technical and aptitude interviews.

You can help with:
- Aptitude questions (Quantitative, Logical Reasoning, Verbal Ability) — explaining concepts, solving questions
- Coding MCQs and DSA concepts (C++, Java, Python) — output-based questions, logic explanation
- Interview tips and strategies — how to answer, time management, body language
- Resume improvement advice — keywords, formatting, ATS optimization
- Explaining solutions step-by-step

Keep responses concise, clear, and encouraging. Use bullet points when listing steps or tips.
If asked something completely unrelated to interviews or study, politely redirect back to interview prep.
Always be friendly, supportive, and motivating toward the student.`;

function Chatbot() {
    const [isOpen,    setIsOpen]    = useState(false);
    const [messages,  setMessages]  = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m your Interview Prep Assistant powered by Groq AI.\n\nI can help you with:\n• Aptitude questions & solutions\n• Coding MCQ explanations\n• Interview tips & strategies\n• Resume advice\n\nWhat would you like help with today?'
        }
    ]);
    const [input,     setInput]     = useState('');
    const [loading,   setLoading]   = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
    }, [isOpen]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setLoading(true);

        try {
            if (!GROQ_API_KEY) {
                throw new Error('GROQ API key not set. Add REACT_APP_GROQ_API_KEY to your front-end/.env file. Get free key at https://console.groq.com');
            }

            // Build messages array for Groq (OpenAI-compatible format)
            const apiMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...newMessages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            ];

            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',   // Model on Groq
                    messages: apiMessages,
                    max_tokens: 600,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData?.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const botReply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

            setMessages(prev => [...prev, { role: 'assistant', content: botReply }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ ${err.message}`
            }]);
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: 'Chat cleared! How can I help you with your interview preparation?'
        }]);
    };

    // Format bot text — bold, bullets, newlines
    const formatText = (text) => {
        return text.split('\n').map((line, i) => {
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={i} dangerouslySetInnerHTML={{ __html: formatted.replace(/^[•\-\*]\s*/, '') }} />;
            }
            if (line === '') return <br key={i} />;
            return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
        });
    };

    const quickQuestions = [
        'Give me an aptitude tip',
        'Explain Big O notation',
        'Top 5 interview tips',
        'How to improve my resume?',
    ];

    return (
        <>
            {/* ── Floating button ── */}
            <button
                className={`cb-fab ${isOpen ? 'cb-fab-open' : ''}`}
                onClick={() => setIsOpen(o => !o)}
                title="Interview Assistant"
                aria-label="Open AI Chatbot"
            >
                {isOpen ? '✕' : '🤖'}
                {!isOpen && <span className="cb-fab-label">AI Assistant</span>}
            </button>

            {/* ── Chat window ── */}
            {isOpen && (
                <div className="cb-window">
                    {/* Header */}
                    <div className="cb-header">
                        <div className="cb-header-info">
                            <div className="cb-avatar">🤖</div>
                            <div>
                                <p className="cb-title">Interview Assistant</p>
                                <p className="cb-subtitle">Powered by Groq AI </p>
                            </div>
                        </div>
                        <div className="cb-header-actions">
                            <button className="cb-clear-btn" onClick={clearChat} title="Clear chat">🗑</button>
                            <button className="cb-close-btn" onClick={() => setIsOpen(false)}>✕</button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="cb-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`cb-msg-row ${msg.role === 'user' ? 'cb-user-row' : 'cb-bot-row'}`}>
                                {msg.role === 'assistant' && <div className="cb-bot-icon">🤖</div>}
                                <div className={`cb-bubble ${msg.role === 'user' ? 'cb-user-bubble' : 'cb-bot-bubble'}`}>
                                    {msg.role === 'assistant'
                                        ? <div className="cb-bot-text">{formatText(msg.content)}</div>
                                        : <span>{msg.content}</span>
                                    }
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {loading && (
                            <div className="cb-msg-row cb-bot-row">
                                <div className="cb-bot-icon">🤖</div>
                                <div className="cb-bubble cb-bot-bubble cb-typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick questions */}
                    {messages.length <= 1 && (
                        <div className="cb-quick">
                            {quickQuestions.map((q, i) => (
                                <button key={i} className="cb-quick-btn"
                                    onClick={() => { setInput(q); inputRef.current?.focus(); }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="cb-input-row">
                        <textarea
                            ref={inputRef}
                            className="cb-input"
                            placeholder="Ask about aptitude, coding, interview tips..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            className="cb-send-btn"
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            title="Send message"
                        >
                            ➤
                        </button>
                    </div>
                    <p className="cb-hint">Enter to send · Shift+Enter for new line</p>
                </div>
            )}
        </>
    );
}

export default Chatbot;
