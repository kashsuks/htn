import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../ui/button';

export const LogoutButton: React.FC = () => {
  const { logout } = useAuth0();

  return (
    <Button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      variant="outline"
      className="bg-[#6100ff] text-white"
    >
      Logout
    </Button>
  );
};

export default LogoutButton;