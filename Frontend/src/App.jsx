import React, { useState, useRef, useEffect } from 'react';

// Main App Component - sets the background and centers the chat window
export default function App() {
  const [theme, setTheme] = useState('dark'); // Default theme is 'dark'

  return (
    // We're assuming 'Inter' or a similar font is set as 'font-sans'
    // in your main tailwind.config.js
    // We add the 'dark' class to this parent element based on the theme state
    <div
      className={`font-sans antialiased text-gray-900 ${
        theme === 'dark' ? 'dark' : ''
      }`}
    >
      <div
        className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-white
                   dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900
                   flex items-center justify-center p-4 transition-colors duration-500"
      >
        <Chat theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
}

// The Chat Component
function Chat({ theme, setTheme }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm Aurora. Your Personal Assistant.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);

  // API endpoint
const API_URL = 'http://127.0.0.1:8000/ask';

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}?question=${encodeURIComponent(input)}`
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (!data.answer) {
        throw new Error('Invalid response from server');
      }
      
      // Add the evidence to the message object
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant',
          text: data.answer,
          evidence: data.evidence || []  // include evidence
        },
      ]);
    } catch (err) {
      console.error(err);
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden
                 flex flex-col h-[90vh] md:h-[85vh] transition-colors duration-500"
    >
      {/* Header */}
      <div className="p-5 text-center border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="w-10"></div> {/* Spacer */}
        <h1 className="text-2xl font-light text-gray-800 dark:text-gray-100">
          Aurora — Ask Anything
        </h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            // Sun Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12H.75m.386-6.364l1.591 1.591M12 12a3 3 0 100 6 3 3 0 000-6z"
              />
            </svg>
          ) : (
            // Moon Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg, index) => (
          <MessageBubble 
            key={index} 
            role={msg.role} 
            text={msg.text} 
            evidence={msg.evidence} // Pass evidence prop
          />
        ))}

        {isLoading && (
          <MessageBubble role="assistant" text="Thinking..." isLoading={true} />
        )}

        {error && <MessageBubble role="error" text={error} />}

        {/* Dummy div for auto-scrolling */}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-100 bg-white 
                   dark:border-gray-700 dark:bg-gray-800 transition-colors duration-500"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask something..."
            className="flex-1 border-none rounded-full py-3 px-5 bg-gray-100 text-gray-700
                       dark:bg-gray-700 dark:text-gray-200
                       focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-500 focus:outline-none
                       disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="ml-3 bg-gray-800 text-white p-3 rounded-full
                       hover:bg-gray-700 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-gray-500
                       disabled:bg-gray-300
                       dark:bg-rose-600 dark:hover:bg-rose-500 
                       dark:focus:ring-rose-700 dark:disabled:bg-gray-600"
          >
            {/* Send Icon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.875L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="p-3 text-center bg-white dark:bg-gray-800 transition-colors duration-500">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Aurora can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ role, text, evidence, isLoading = false }) {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isError = role === 'error';

  // Base classes
  let bubbleClasses =
    'max-w-xs md:max-w-md px-5 py-3 rounded-2xl transition-all duration-300 ease-in-out opacity-0 animate-fade-in';
  let wrapperClasses = 'flex';

  if (isUser) {
    bubbleClasses +=
      ' bg-gray-800 text-white rounded-br-none dark:bg-rose-600 dark:text-white';
    wrapperClasses += ' justify-end';
  } else if (isAssistant) {
    bubbleClasses +=
      ' bg-stone-100 text-gray-700 rounded-bl-none dark:bg-gray-700 dark:text-gray-200';
    wrapperClasses += ' justify-start';
  } else if (isError) {
    bubbleClasses +=
      ' bg-red-100 text-red-700 rounded-bl-none dark:bg-red-800 dark:text-red-200';
    wrapperClasses += ' justify-start';
  }

  // Add a simple fade-in effect.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10); // slight delay to trigger transition
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`${wrapperClasses} ${
        visible ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-500`}
    >
      <div
        className={`${bubbleClasses} ${
          visible ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-500`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        ) : (
          <>
            {/* Display message text */}
            <p>{text}</p>
            {/* Display evidence if it exists */}
            {evidence && evidence.length > 0 && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2">
                <p className="font-semibold mb-1">Evidence:</p>
                <ul className="list-disc ml-4 space-y-1">
                  {evidence.map((e, idx) => (
                    <li key={idx} className="break-all">"{e}"</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}