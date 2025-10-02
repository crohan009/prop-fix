import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Create session on mount
  useEffect(() => {
    createSession();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createSession = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/chat/session`, {
        user_name: 'Guest'
      });
      setSessionId(response.data.session_id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;
    if (!sessionId) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      imagePreview: imagePreview
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('message', inputMessage);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await axios.post(`${BACKEND_URL}/api/chat`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        agent: response.data.agent_used,
        timestamp: response.data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Clear inputs
      setInputMessage('');
      handleRemoveImage();
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        agent: 'System',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="logo-title">PropFix Assistant</h1>
              <p className="logo-subtitle">AI-Powered Property Solutions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="chat-container">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="welcome-section">
              <div className="welcome-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="welcome-title">Welcome to PropFix Assistant</h2>
              <p className="welcome-text">
                Your intelligent real estate companion powered by two specialized AI agents
              </p>
              
              <div className="agent-cards">
                <Card className="agent-card">
                  <div className="agent-card-icon agent-1-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14.7 6.3C14.3 6.3 14 6 14 5.6V3.4C14 3 14.3 2.7 14.7 2.7C15.1 2.7 15.4 3 15.4 3.4V5.6C15.4 6 15.1 6.3 14.7 6.3Z" fill="currentColor"/>
                      <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 className="agent-card-title">Issue Detection Agent</h3>
                  <p className="agent-card-desc">
                    Upload property images to identify and troubleshoot issues like damage, leaks, or repairs
                  </p>
                </Card>
                
                <Card className="agent-card">
                  <div className="agent-card-icon agent-2-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="agent-card-title">Tenancy FAQ Agent</h3>
                  <p className="agent-card-desc">
                    Get answers about leases, rent, tenant rights, and landlord responsibilities
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar assistant-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                
                <div className="message-content">
                  {msg.role === 'assistant' && msg.agent && (
                    <div className="agent-badge">{msg.agent}</div>
                  )}
                  
                  {msg.imagePreview && (
                    <div className="message-image">
                      <img src={msg.imagePreview} alt="Uploaded" />
                    </div>
                  )}
                  
                  <div className="message-text">{msg.content}</div>
                </div>
                
                {msg.role === 'user' && (
                  <div className="message-avatar user-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="message assistant">
                <div className="message-avatar assistant-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className="input-container">
        <div className="input-wrapper">
          {imagePreview && (
            <div className="image-preview-container">
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button 
                  className="remove-image-btn"
                  onClick={handleRemoveImage}
                  data-testid="remove-image-button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="input-controls">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              style={{ display: 'none' }}
              data-testid="image-upload-input"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="attach-btn"
              disabled={loading}
              data-testid="attach-image-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88581 21.3658 3.76 20.24C2.63419 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63419 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38781 15.78 1.38781C16.8414 1.38781 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7822 4.32863 19.7822 5.39C19.7822 6.45137 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your property issue or ask about tenancy..."
              className="message-input"
              disabled={loading}
              rows={1}
              data-testid="message-input"
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={loading || (!inputMessage.trim() && !selectedImage)}
              className="send-btn"
              data-testid="send-message-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;