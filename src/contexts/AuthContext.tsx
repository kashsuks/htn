import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  picture: string;
  gameStats: {
    totalGamesPlayed: number;
    totalWins: number;
    totalLosses: number;
    bestScore: number;
    totalProfit: number;
    averageScore: number;
    winRate: number;
  };
  achievements: Achievement[];
  preferences: {
    theme: string;
    notifications: boolean;
    difficulty: string;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earnedAt: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  createOrUpdateProfile: () => Promise<void>;
  updateGameStats: (gameResult: any) => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  getLeaderboard: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const getAuthHeaders = async () => {
    try {
      const token = await getAccessTokenSilently();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  const createOrUpdateProfile = async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          picture: user.picture,
        }),
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else {
        console.error('Failed to create/update profile');
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers,
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else if (response.status === 404) {
        // Profile doesn't exist, create it
        await createOrUpdateProfile();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGameStats = async (gameResult: any) => {
    if (!isAuthenticated) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/game-result`, {
        method: 'POST',
        headers,
        body: JSON.stringify(gameResult),
      });

      if (response.ok) {
        const result = await response.json();
        setUserProfile(result.userProfile);
      }
    } catch (error) {
      console.error('Error updating game stats:', error);
    }
  };

  const updatePreferences = async (preferences: any) => {
    if (!isAuthenticated) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/profile/preferences`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const getLeaderboard = async () => {
    // For now, leaderboard redirects to profile - no API call needed
    console.log('Leaderboard functionality not implemented yet - redirecting to profile');
    return [];
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [isAuthenticated, user]);

  const value = {
    userProfile,
    loading,
    createOrUpdateProfile,
    updateGameStats,
    updatePreferences,
    getLeaderboard,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
