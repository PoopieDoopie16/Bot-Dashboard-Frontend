import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [botStatus, setBotStatus] = useState(null);
  const [theme, setTheme] = useState('light-mode');
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [error, setError] = useState('');
  const [isPopoutOpen, setIsPopoutOpen] = useState(false); // State for controlling popout

  // Fetch bot status
  const fetchBotStatus = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/status`);
      const data = await response.json();
      setBotStatus(data);
    } catch (error) {
      console.error('Error fetching bot status:', error);
    }
  };

  // Fetch servers (guilds)
  const fetchServers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/servers`);
      const data = await response.json();
      setServers(data);
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
  };

  // Fetch channels of a selected server
  const fetchChannels = async (serverId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/channels/${serverId}`);
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  // Fetch messages of a selected channel
  const fetchMessages = async (channelId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/${channelId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message to selected channel
  const sendMessage = async () => {
    if (!selectedChannel || !newMessage.trim()) return;

    setLoadingMessage(true); // Show loading state
    setError(''); // Reset previous error messages

    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannel, message: newMessage }),
      });

      setNewMessage(''); // Reset message input after sending
      fetchMessages(selectedChannel); // Refresh messages after sending
    } catch (error) {
      setError('Failed to send message. Please try again later.');
      console.error('Error sending message:', error);
    } finally {
      setLoadingMessage(false); // Hide loading state
    }
  };

  // Toggle theme between light and dark mode
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light-mode' ? 'dark-mode' : 'light-mode'));
  };

  // Open or close the popout window
  const togglePopout = () => {
    setIsPopoutOpen(!isPopoutOpen);
  };

  // Component to show Bot Status
  const BotStatus = () => (
    <div>
      <h2>Bot Status</h2>
      {botStatus ? (
        <div>
          <p>Status: {botStatus.status}</p>
          <p>Uptime: {botStatus.uptime}</p>
        </div>
      ) : (
        <p>Loading bot status...</p>
      )}
    </div>
  );

  // Component to show Servers and Channels
  const ServerSelection = () => {
    return (
      <div>
        <h2>Select a Server</h2>
        <select
          onChange={(e) => {
            const serverId = e.target.value;
            setSelectedServer(serverId);
            fetchChannels(serverId);
            setMessages([]); // Clear messages when selecting a new server
            setSelectedChannel(null); // Reset selected channel
          }}
          value={selectedServer || ''}
        >
          <option value="">Select a server</option>
          {servers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name}
            </option>
          ))}
        </select>

        {selectedServer && (
          <div>
            <h3>Select a Channel</h3>
            <select
              onChange={(e) => {
                const channelId = e.target.value;
                setSelectedChannel(channelId);
                fetchMessages(channelId);
              }}
              value={selectedChannel || ''}
            >
              <option value="">Select a channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button onClick={togglePopout}>Open Messages Popout</button>
      </div>
    );
  };

  // Component to show live messages in popout
  const PopoutMessages = () => (
    <div className="popout-window">
      <div className="popout-header">
        <button onClick={togglePopout}>Close</button>
      </div>
      <div className="message-history">
        {messages
          .slice()
          .reverse()
          .map((msg) => (
            <div key={msg.id} className="message">
              <img
                src={msg.authorAvatar || 'default-avatar.png'}
                alt={`${msg.author}'s avatar`}
                className="avatar"
              />
              <div className="message-content">
                <div className="message-header">
                  <strong className="author">{msg.author}</strong>
                  <span className="timestamp">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p className="message-text">{msg.content}</p>
              </div>
            </div>
          ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message here"
      />
      <button onClick={sendMessage} disabled={loadingMessage}>
        {loadingMessage ? 'Sending...' : 'Send'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );

  useEffect(() => {
    if (currentPage === 'dashboard') {
      fetchBotStatus();
    } else if (currentPage === 'messages') {
      fetchServers();
    }
  }, [currentPage]);

  return (
    <div className={`App ${theme}`}>
      <header>
        <div className="nav">
          <h1>Bot Dashboard</h1>
          <button onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
          <button onClick={() => setCurrentPage('messages')}>Live Messages</button>
        </div>
      </header>
      <main>
        {currentPage === 'dashboard' && <BotStatus />}
        {currentPage === 'messages' && <ServerSelection />}
      </main>

      {isPopoutOpen && <PopoutMessages />}

      <button className="theme-toggle" onClick={toggleTheme}>
        🌙 / 🌞
      </button>
    </div>
  );
}

export default App;
