import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from "prop-types";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user');
      setUser(userData ? JSON.parse(userData) : null);
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
}
AuthProvider.propTypes={
  children: PropTypes.node
}
export const useAuth = () => useContext(AuthContext); 