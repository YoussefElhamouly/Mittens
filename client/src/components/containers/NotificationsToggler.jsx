import React, { useState, useRef } from 'react';
import { handleRequest } from '../../utils/helperFunctions';

import { useDispatch } from 'react-redux';
import { setNotificationSettings } from '../../Redux/Slices/userDataSlice';
const NotificationsToggler = ({ description, isToggled, type }) => {
  const dispatch = useDispatch();
  const [isChecked, setIschecked] = useState(isToggled);

  const [isLoaing, setIsLoading] = useState(false);
  const fetchIntervalRef = useRef(null);
  const handleToggle = async (e) => {
    const isToggled = e.target.checked;
    setIschecked(isToggled);
    await handleRequest(
      new Request(`/api/users/updateNotificationsSettings/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isToggled: isToggled }),
      }),
      fetchIntervalRef,
      setIsLoading,
      (data) => {
        dispatch(setNotificationSettings(data?.notificationSettings));
      },
      (err) => {
        console.log(err);
        setIschecked(!isToggled);
      }
    );
  };
  return (
    <div className="notificationsToggler-container">
      <h4 className="notifications-settings-title">{description}</h4>
      <label className="switch" style={{ pointerEvents: isLoaing ? 'none' : 'auto', opacity: isLoaing ? 0.5 : 1 }}>
        <input type="checkbox" style={{ display: 'none' }} defaultChecked={isChecked} onChange={handleToggle} /> <span className="slider round"></span>
      </label>
    </div>
  );
};

export default NotificationsToggler;
