import React, { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SocketContext } from './SocketContext.jsx';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
const ProtectedRoutes = () => {
  const { isLoggedIn, isLoading } = useSelector((state) => state.userData);
  const { isSocketReady } = useContext(SocketContext);
  const location = useLocation();
  if (isLoading) {
    return <></>;
  }

  if (!isLoggedIn && !isLoading) {
    localStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" />;
  }

  if (isSocketReady && !isLoading) return <Outlet />;
};

export default ProtectedRoutes;
