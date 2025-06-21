import React, { createContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { getUserData, getIsLoggedIn } from '../../Redux/Slices/userDataSlice.js';

const SocketContext = createContext();

const SocketContextProvider = ({ children }) => {
  const socket = useRef();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const userData = useSelector(getUserData);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const domain = import.meta.env.VITE_DOMAIN;
  const listenersSetup = useRef(false);

  // Ref to hold signaling data (offer, candidates) without triggering re-renders
  const signalingDataRef = useRef({});
  const activeCallRef = useRef(activeCall);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    if (isLoggedIn) {
      if (!socket.current) {
        const socketURL = import.meta.env.PROD ? window.location.origin : `http://${window.location.hostname}:3000`;
        socket.current = io(socketURL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 2000,
          withCredentials: true,
        });

        socket.current.on('connect', () => {
          setIsSocketReady(true);

          if (userData?.userTag) {
            socket.current.emit('joinNotificationsRoom', userData.userTag);
          }
        });

        socket.current.on('disconnect', () => {
          setIsSocketReady(false);
        });

        if (!listenersSetup.current) {
          socket.current.on('incomingCall', (data) => {
            // Pre-initialize storage for signaling data for this caller
            signalingDataRef.current[data.callerUserTag] = { iceCandidates: [] };
            setIncomingCall(data);
          });

          socket.current.on('callAnswered', (data) => {
            if (data.answer) {
              // Use ref to avoid stale state
              if (activeCallRef.current && activeCallRef.current.targetUserTag === data.answererUserTag) {
                setActiveCall((prev) => ({ ...prev, status: 'connecting' }));
              }
            } else {
              setActiveCall(null);
            }
          });

          socket.current.on('callEnded', (data) => {
            // Clean up signaling data for the call that ended
            delete signalingDataRef.current[data.endedBy];
            setActiveCall(null);
            setIncomingCall(null);
          });

          socket.current.on('offer', (data) => {
            if (!signalingDataRef.current[data.fromUserTag]) {
              signalingDataRef.current[data.fromUserTag] = { iceCandidates: [] };
            }
            signalingDataRef.current[data.fromUserTag].offer = data.offer;
          });

          socket.current.on('answer', (data) => {
            // Use ref to avoid stale state
            if (activeCallRef.current && activeCallRef.current.targetUserTag === data.fromUserTag) {
              setActiveCall((prev) => ({ ...prev, answer: data.answer }));
            }
          });

          socket.current.on('iceCandidate', (data) => {
            if (!signalingDataRef.current[data.fromUserTag]) {
              signalingDataRef.current[data.fromUserTag] = { iceCandidates: [] };
            }
            const signalingForUser = signalingDataRef.current[data.fromUserTag];
            if (signalingForUser) {
              signalingForUser.iceCandidates.push(data.candidate);
            }
          });

          listenersSetup.current = true;
        }
      }
    } else {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
        listenersSetup.current = false;
        signalingDataRef.current = {}; // Clear signaling data on logout
      }
      setIsSocketReady(false);
      setIncomingCall(null);
      setActiveCall(null);
    }
  }, [isLoggedIn, userData]);

  const initiateCall = useCallback(
    (targetUserTag) => {
      if (!socket.current?.connected) {
        return;
      }

      const callData = {
        targetUserTag: targetUserTag,
        callerInfo: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          userTag: userData.userTag,
          profilePicture: userData.profilePicture,
        },
      };
      socket.current.emit('initiateCall', callData);
      setActiveCall({
        type: 'outgoing',
        targetUserTag: targetUserTag,
        status: 'ringing',
      });
    },
    [socket, userData]
  );

  const answerCall = (answer) => {
    if (!incomingCall) {
      return;
    }

    const callerUserTag = incomingCall.callerUserTag;
    const answerData = { callerUserTag, answer };
    socket.current.emit('answerCall', answerData);

    if (answer) {
      const storedData = signalingDataRef.current[callerUserTag] || {};
      setActiveCall({
        type: 'incoming',
        targetUserTag: callerUserTag,
        status: 'connecting',
        offer: storedData.offer,
        iceCandidates: storedData.iceCandidates,
      });
    }

    setIncomingCall(null);
    delete signalingDataRef.current[callerUserTag];
  };

  const endCall = () => {
    if (activeCall) {
      socket.current.emit('endCall', { targetUserTag: activeCall.targetUserTag });
      delete signalingDataRef.current[activeCall.targetUserTag];
      setActiveCall(null);
    }
  };

  const sendOffer = useCallback(
    (targetUserTag, offer) => {
      socket.current.emit('offer', { targetUserTag, offer });
    },
    [socket]
  );

  const sendAnswer = useCallback(
    (targetUserTag, answer) => {
      socket.current.emit('answer', { targetUserTag, answer });
    },
    [socket]
  );

  const sendIceCandidate = useCallback(
    (targetUserTag, candidate) => {
      socket.current.emit('iceCandidate', { targetUserTag, candidate });
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        domain,
        isSocketReady,
        incomingCall,
        activeCall,
        initiateCall,
        answerCall,
        endCall,
        sendOffer,
        sendAnswer,
        sendIceCandidate,
      }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketContextProvider };
