import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../ui/button';

export const LoginButton: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <Button
      onClick={() => loginWithRedirect()}
      className="bg-[#6100ff] hover:bg-[#370090] text-white text-xl font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
    >
      Login / Sign Up
    </Button>
  );
};

export default LoginButton;
