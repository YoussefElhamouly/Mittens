import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userData: null,
  isLoggedIn: false,
  isloading: true,
};
const userDataSlice = createSlice({
  name: 'userData',
  initialState: initialState,
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setIsLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isloading = action.payload;
    },
    setUnReadNotificationsCount: (state, action) => {
      state.userData.unReadNotifications = action.payload;
    },
    setNotificationSettings: (state, action) => {
      state.userData.notificationSettings = action.payload;
    },
    incrementUnReadNotificationsCount: (state) => {
      state.userData.unReadNotifications += 1;
    },
  },
});

const { setUserData, setIsLoading, setIsLoggedIn, setUnReadNotificationsCount, setNotificationSettings, incrementUnReadNotificationsCount } = userDataSlice.actions;
const userDataReducer = userDataSlice.reducer;
const getUserData = (state) => state.userData.userData;
const getIsLoggedIn = (state) => state.userData.isLoggedIn;
const getIsLoading = (state) => state.userData.isloading;

export { setUserData, setIsLoading, setIsLoggedIn, setUnReadNotificationsCount, setNotificationSettings, getUserData, getIsLoggedIn, getIsLoading, incrementUnReadNotificationsCount };
export default userDataReducer;
