import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import LogoutButton from './LogoutButton';

export const UserProfile: React.FC = () => {
  const { user, isAuthenticated } = useAuth0();
  const { userProfile, loading } = useAuthContext();

  if (!isAuthenticated || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading profile...</div>
      </div>
    );
  }

  const achievements = userProfile?.achievements || [];

  return (
    <div className="min-h-screen scanlines crt-screen text-white pixel-font" style={{backgroundColor: '#061625'}}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-4 neon-border-pink p-6" style={{backgroundColor: 'rgba(255, 0, 233, 0.1)'}}>
          <div className="flex items-center gap-4">
            <img
              src={user.picture}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 neon-border-yellow"
            />
            <div>
              <h1 className="text-4xl retro-title neon-pink glitch-effect">{user.name}</h1>
              <p className="text-lg neon-blue">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/60 border-2 neon-border-blue">
            <TabsTrigger value="achievements" className="pixel-font text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">🏆 ACHIEVEMENTS</TabsTrigger>
            <TabsTrigger value="leaderboard" className="pixel-font text-white data-[state=active]:bg-green-600 data-[state=active]:text-white">🥇 LEADERBOARD</TabsTrigger>
            <TabsTrigger value="settings" className="pixel-font text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">⚙️ SETTINGS</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 neon-border-yellow">
              <CardHeader className="bg-yellow-900/20 border-b border-yellow-400/30">
                <CardTitle className="text-yellow-300 pixel-font text-xl">🏆 ACHIEVEMENTS ({achievements.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-yellow-200 text-lg pixel-font mb-2">
                      NO ACHIEVEMENTS YET
                    </p>
                    <p className="text-gray-300 retro-body">
                      Start playing to earn your first achievement!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="bg-black/60 rounded-lg p-4 border-2 neon-border-yellow hover:bg-yellow-900/20 transition-all duration-300"
                      >
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h3 className="font-bold text-yellow-300 pixel-font">{achievement.name}</h3>
                        <p className="text-sm text-gray-200 mb-2 retro-body">{achievement.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge variant={achievement.rarity === 'common' ? 'secondary' : 
                                        achievement.rarity === 'uncommon' ? 'default' :
                                        achievement.rarity === 'rare' ? 'destructive' : 'outline'}>
                            {achievement.rarity}
                          </Badge>
                          <span className="text-xs text-gray-300 pixel-font">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 neon-border-green">
              <CardHeader className="bg-green-900/20 border-b border-green-400/30">
                <CardTitle className="text-green-300 pixel-font text-xl">🥇 GLOBAL LEADERBOARD</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-xl font-bold text-green-300 pixel-font mb-4">LEADERBOARD COMING SOON!</h3>
                  <p className="text-gray-200 mb-6 retro-body text-lg">
                    The global leaderboard feature is currently under development.
                  </p>
                  <p className="text-gray-300 retro-body">
                    For now, focus on improving your trading skills and check back later!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 neon-border-blue">
              <CardHeader className="bg-purple-900/20 border-b border-purple-400/30">
                <CardTitle className="text-purple-300 pixel-font text-xl">⚙️ PREFERENCES</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h3 className="text-xl font-bold text-purple-300 pixel-font mb-4">SETTINGS PANEL COMING SOON!</h3>
                  <p className="text-gray-200 retro-body text-lg">
                    Customization options will be available here soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
