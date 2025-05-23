import React, { useContext } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { SocketContext } from './SocketContext.jsx';
import { useSelector } from 'react-redux';

const ProtectedRoutes = () => {
  const { isLoggedIn, isLoading } = useSelector((state) => state.userData);
  const { isSocketReady } = useContext(SocketContext);
  const location = useLocation();

  if (isLoading) {
    return <></>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (location.pathname == '/login') {
    return <Navigate to="/" />;
  }

  if (isSocketReady && !isLoading) return <Outlet />;
};

export default ProtectedRoutes;
