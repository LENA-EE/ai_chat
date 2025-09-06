import React from 'react';
import { useState } from 'react';

function App() {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'saiga', // или 'saiga'
          prompt: inputText,
          stream: false,
        }),
      });
      
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Ошибка:', error);
      setResponse('Не удалось получить ответ 😢');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div style={{ padding: '20px' }}>
      <h1>Чат с Mistral/Saiga</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Введите запрос..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
      {response && (
        <div style={{ marginTop: '20px', whiteSpace: 'pre-line' }}>
          <strong>Ответ:</strong> {response}
        </div>
      )}
    </div></>
  );
}

export default App;