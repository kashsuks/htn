import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../ui/button';

export const LoginButton: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <Button
      onClick={() => loginWithRedirect()}
      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
    >
      🚀 Login / Sign Up
    </Button>
  );
};

export default LoginButton;
