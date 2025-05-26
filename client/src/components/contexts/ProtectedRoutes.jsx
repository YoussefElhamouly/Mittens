import React, { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SocketContext } from './SocketContext.jsx';
import { useSelector } from 'react-redux';

const ProtectedRoutes = () => {
  const { isLoggedIn, isLoading } = useSelector((state) => state.userData);
  const { isSocketReady } = useContext(SocketContext);

  if (isLoading) {
    return <></>;
  }

  if (!isLoggedIn && !isLoading) {
    return <Navigate to="/login" />;
  }

  if (isSocketReady && !isLoading) return <Outlet />;
};

export default ProtectedRoutes;
