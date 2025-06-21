import React, { useContext } from 'react';
import { SocketContext } from './contexts/SocketContext';
import IncomingCallWindow from './window/IncomingCallWindow';
import ActiveCallWindow from './window/ActiveCallWindow';

const CallManager = () => {
  const { incomingCall, activeCall } = useContext(SocketContext);

  console.log('🔍 CallManager Debug:');
  console.log('📞 Incoming call:', incomingCall);
  console.log('📞 Active call:', activeCall);

  return (
    <>
      {incomingCall && <IncomingCallWindow callData={incomingCall} onClose={() => {}} />}

      {activeCall && <ActiveCallWindow callData={activeCall} onClose={() => {}} />}
    </>
  );
};

export default CallManager;
