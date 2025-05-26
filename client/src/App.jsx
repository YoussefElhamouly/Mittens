import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { handleRequest } from './utils/helperFunctions';
import ProtectedRoutes from './components/contexts/ProtectedRoutes';
import { ActiveChatContextProvider } from './components/contexts/ActiveChatContext';
import { ProfileDataContextProvider } from './components/contexts/ProfileDataContext';
import { SocketContextProvider } from './components/contexts/SocketContext';
import { useSelector, useDispatch } from 'react-redux';
import { setIsLoading, setIsLoggedIn, setUserData } from './Redux/Slices/userDataSlice';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const HomePage = lazy(() => import('./pages/HomePage'));
const Profile = lazy(() => import('./pages/Profile'));
const Chats = lazy(() => import('./pages/Chats'));
const PostSearchBlock = lazy(() => import('./components/FeedContent/PostSearchBlock'));
const NotFound = lazy(() => import('./pages/NotFound'));

import './css/main.css';

const router = createBrowserRouter([
  {
    element: <ProtectedRoutes />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/Mewtopia/:tag',
        element: (
          <ProfileDataContextProvider>
            <Profile />
          </ProfileDataContextProvider>
        ),
      },
      { path: '/posts/:id', element: <PostSearchBlock /> },
      {
        path: '/chats',
        element: (
          <ActiveChatContextProvider>
            <Chats />
          </ActiveChatContextProvider>
        ),
      },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '*', element: <NotFound /> },
]);

const App = () => {
  const fetchIntervalRef = useRef();
  const dispatch = useDispatch();
  const autologin = () => {
    handleRequest(
      new Request('/api/auth/autoLogin', { method: 'post', credentials: 'same-origin' }),
      fetchIntervalRef,
      (state) => {
        dispatch(setIsLoading(state));
      },
      (data) => {
        dispatch(setUserData(data));
        dispatch(setIsLoggedIn(true));
      },
      () => {
        dispatch(setUserData(null));
        dispatch(setIsLoggedIn(false));
      }
    );
  };

  useEffect(() => {
    autologin();
  }, []);

  return (
    <SocketContextProvider>
      <Suspense>
        <RouterProvider router={router} />
      </Suspense>
    </SocketContextProvider>
  );
};

export default App;
