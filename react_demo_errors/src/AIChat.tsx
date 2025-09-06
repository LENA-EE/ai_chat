// frontend/src/components/AIChat.jsx
import { useState } from 'react';
import React from 'react'
import './AIChat.css';

export default function AIChat() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [sources,setSources]=useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [currentGradient, setCurrentGradient] = useState('gradient-purple');

  const gradients = ['gradient-purple', 'gradient-blue', 'gradient-sunset', 'gradient-ocean'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    // Выбираем случайный градиент для нового ответа
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    setCurrentGradient(randomGradient);

    try {
      const res = await fetch('http://localhost:3001/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      if (!res.ok) throw new Error('Ошибка сети');
      
      const data = await res.json();
      setResponse(data.response);
      setSources(data.sources[0])

    } catch (err) {
      setResponse('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat-container">
      <h2>AI-помощник по документам</h2>
      
      <form onSubmit={handleSubmit} className="query-form">
        <div className="input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Например: Как оформить возврат комиссии?"
            disabled={isLoading}
            className="query-input"
          />
          <button 
            type="submit" 
            disabled={isLoading} 
            className="submit-btn"
          >
            {isLoading ? 'Поиск...' : 'Найти'}
          </button>
        </div>
      </form>

      {isLoading && <div className="loading">Поиск в документах...</div>}

      {response && (
        <div className={`response-container ${currentGradient}`}>
          <h3>Ответ:</h3>
          <div className="response-content">
            <p>{response}</p>
            <div className="sources">
              <hr/>
              <small>Источник- внутренняя база знаний банка: "{sources?.title}"</small>
              <br/>
              <small>ссылка <a>{sources?.url}</a></small>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}