import React, { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SocketContext } from '../contexts/SocketContext';

const ActiveCallWindow = ({ callData, onClose }) => {
  const { endCall, sendOffer, sendAnswer, sendIceCandidate } = useContext(SocketContext);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [isPeerConnectionReady, setIsPeerConnectionReady] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const durationIntervalRef = useRef();
  const processedCandidatesRef = useRef(new Set());
  const audioContextRef = useRef();
  const gainNodeRef = useRef();

  // Validate call data
  if (!callData || !callData.targetUserTag) {
    console.error('❌ ActiveCallWindow: Invalid call data', callData);
    return null; // Don't render if no valid call data
  }

  useEffect(() => {
    if (!callData || !callData.targetUserTag) {
      setError('Invalid call data. Please try again.');
      return;
    }

    initializeCall();
    startCallTimer();

    return () => {
      cleanup();
    };
  }, [callData.targetUserTag]);

  // Listen for WebRTC events from SocketContext
  useEffect(() => {
    if (!isPeerConnectionReady || !peerConnectionRef.current) {
      return;
    }

    // Only process events if we have a valid peer connection
    if (callData.offer && !peerConnectionRef.current.remoteDescription) {
      handleOffer(callData.offer);
    }
    if (callData.answer && !peerConnectionRef.current.remoteDescription) {
      handleAnswer(callData.answer);
    }
    if (callData.iceCandidates && callData.iceCandidates.length > 0) {
      callData.iceCandidates.forEach((candidate) => {
        const candidateString = JSON.stringify(candidate);
        if (candidate && !processedCandidatesRef.current.has(candidateString)) {
          handleIceCandidate(candidate);
          processedCandidatesRef.current.add(candidateString);
        }
      });
    }
  }, [callData.offer, callData.answer, callData.iceCandidates, callData.targetUserTag, isPeerConnectionReady]);

  const cleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const startCallTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeCall = async () => {
    try {
      setError(null);

      // Validate call data again
      if (!callData || !callData.targetUserTag) {
        throw new Error('Invalid call data');
      }

      // Get user media with better audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create RTCPeerConnection
      const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun2.l.google.com:19302' }],
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(callData.targetUserTag, event.candidate);
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];

          // Create audio context for better audio control
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Create a media stream source from the remote stream
            const source = audioContextRef.current.createMediaStreamSource(event.streams[0]);

            // Create a gain node to control volume
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.gain.value = 1.0; // Set volume to 100%

            // Connect the audio pipeline
            source.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioContextRef.current.destination);

            // Resume audio context if suspended
            if (audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume();
            }

            // Also try to play the video element as backup
            remoteVideoRef.current.play().catch((e) => {});
          } catch (error) {
            // Fallback to video element
            remoteVideoRef.current.play().catch((e) => {});
          }
        }
        setCallStatus('connected');
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        switch (peerConnection.connectionState) {
          case 'connected':
            setCallStatus('connected');
            break;
          case 'failed':
            setCallStatus('failed');
            setError('Connection failed. Please try again.');
            break;
          case 'disconnected':
            setCallStatus('disconnected');
            setError('Connection lost.');
            break;
          default:
            setCallStatus(peerConnection.connectionState);
        }
      };

      // Handle ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection.iceConnectionState === 'failed') {
          setError('ICE connection failed. Please check your network connection.');
        }
      };

      // Mark PeerConnection as ready after all handlers are set up
      setIsPeerConnectionReady(true);

      // Create offer if outgoing, or handle pre-existing offer if incoming
      if (callData.type === 'outgoing') {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendOffer(callData.targetUserTag, offer);
      } else if (callData.type === 'incoming' && callData.offer) {
        await handleOffer(callData.offer);
      }
    } catch (error) {
      setCallStatus('failed');
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Failed to initialize call: ${error.message}`);
      }
    }
  };

  const handleOffer = async (offer) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        sendAnswer(callData.targetUserTag, answer);
      }
    } catch (error) {
      setError('Failed to establish connection.');
    }
  };

  const handleAnswer = async (answer) => {
    try {
      if (peerConnectionRef.current && !peerConnectionRef.current.remoteDescription) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      setError('Failed to establish connection.');
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      // Silently handle ICE candidate errors
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const adjustVolume = (volume) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  };

  const startAudioContext = async () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      } else if (!audioContextRef.current && remoteStream) {
        // Create audio context on user interaction
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(remoteStream);
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = 1.0;
        source.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
    } catch (error) {
      // Silently handle audio context errors
    }
  };

  const testAudio = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Create a simple test tone
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 1);
    } catch (error) {
      // Silently handle test audio errors
    }
  };

  const handleEndCall = () => {
    cleanup();
    endCall();
    onClose();
  };

  return createPortal(
    <div className="window-outer-container">
      <div className="side-block window active-call-window" style={{ height: 'fit-content', width: '500px' }}>
        <div className="call-header">
          <div className="call-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19c-.54 0-.99.45-.99.99 0 9.36 7.6 16.96 16.96 16.96.54 0 .99-.45.99-.99v-3.5c0-.54-.45-.99-.99-.99z" />
            </svg>
          </div>
          <h2>Voice Call</h2>
          <p className="call-status">{callStatus === 'connecting' ? 'Connecting...' : callStatus === 'connected' ? 'Connected' : callStatus === 'failed' ? 'Connection Failed' : callStatus === 'disconnected' ? 'Disconnected' : callStatus}</p>
          <p className="call-duration">{formatDuration(callDuration)}</p>
          {error && (
            <p className="call-error" style={{ color: '#f44336', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {error}
            </p>
          )}
        </div>

        <div className="call-controls">
          <button
            className="generic-button mute-btn"
            onClick={toggleMute}
            disabled={callStatus !== 'connected'}
            style={{
              backgroundColor: isMuted ? '#f44336' : '#666',
              color: 'white',
              marginRight: '1rem',
              opacity: callStatus !== 'connected' ? 0.5 : 1,
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
              {isMuted ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              ) : (
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              )}
            </svg>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            className="generic-button end-call-btn"
            onClick={handleEndCall}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
            </svg>
            End Call
          </button>
        </div>

        {/* Audio elements for voice call */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '1px',
            height: '1px',
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
          }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '1px',
            height: '1px',
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
          }}
        />
      </div>
    </div>,
    document.body
  );
};

export default ActiveCallWindow;
