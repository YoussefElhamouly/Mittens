import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { SocketContext } from '../contexts/SocketContext';

const IncomingCallWindow = ({ callData, onClose }) => {
  const { answerCall } = useContext(SocketContext);

  const handleAnswer = (accept) => {
    answerCall(accept);
    onClose();
  };

  return createPortal(
    <div className="window-outer-container">
      <div className="side-block window incoming-call-window" style={{ height: 'fit-content', width: '400px' }}>
        <div className="call-header">
          <div className="call-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19c-.54 0-.99.45-.99.99 0 9.36 7.6 16.96 16.96 16.96.54 0 .99-.45.99-.99v-3.5c0-.54-.45-.99-.99-.99z" />
            </svg>
          </div>
          <h2>Incoming Call</h2>
          <p className="caller-name">
            {callData.callerInfo.firstName} {callData.callerInfo.lastName}
          </p>
          <p className="caller-tag">@{callData.callerInfo.userTag}</p>
        </div>

        <div className="call-actions">
          <button
            className="generic-button accept-call-btn"
            onClick={() => handleAnswer(true)}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              marginRight: '1rem',
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19c-.54 0-.99.45-.99.99 0 9.36 7.6 16.96 16.96 16.96.54 0 .99-.45.99-.99v-3.5c0-.54-.45-.99-.99-.99z" />
            </svg>
            Accept
          </button>
          <button
            className="generic-button reject-call-btn"
            onClick={() => handleAnswer(false)}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
            </svg>
            Decline
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallWindow;
