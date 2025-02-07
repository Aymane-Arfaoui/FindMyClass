import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserInfo = async (token) => {
    if(!token) return null;
    try{
      const response = await fetch("https://www.googleapis.com/userinfo/v2/me",
      { 
            headers : {Authorization: `Bearer ${token}`},
      }
    );
    const user = await response.json();
    await AsyncStorage.setItem("@user", JSON.stringify(user));
    return user;
    }catch(error){
      console.log(error);
      return null;
    }
  }