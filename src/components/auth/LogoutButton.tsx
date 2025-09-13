import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../ui/button';

export const LogoutButton: React.FC = () => {
  const { logout } = useAuth0();

  return (
    <Button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      variant="outline"
      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
    >
      🚪 Logout
    </Button>
  );
};

export default LogoutButton;
