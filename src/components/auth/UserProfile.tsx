import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
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

  const stats = userProfile?.gameStats || {
    totalGamesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    bestScore: 0,
    totalProfit: 0,
    averageScore: 0,
    winRate: 0,
  };

  const achievements = userProfile?.achievements || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full border-4 border-yellow-400"
            />
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-gray-300">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">📊 Stats</TabsTrigger>
            <TabsTrigger value="achievements">🏆 Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">🥇 Leaderboard</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-black/40 border-green-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-400 text-sm">Games Played</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalGamesPlayed}</div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-blue-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-400 text-sm">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.winRate.toFixed(1)}%</div>
                  <Progress value={stats.winRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-yellow-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-yellow-400 text-sm">Best Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${stats.bestScore.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-400 text-sm">Total Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${stats.totalProfit.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-gray-600">
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Wins:</span>
                    <span className="text-green-400 font-bold">{stats.totalWins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Losses:</span>
                    <span className="text-red-400 font-bold">{stats.totalLosses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Score:</span>
                    <span className="text-blue-400 font-bold">${stats.averageScore.toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-gray-600">
                <CardHeader>
                  <CardTitle>Trading Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {stats.totalGamesPlayed < 5 ? '🌱' : 
                       stats.totalGamesPlayed < 20 ? '📈' : 
                       stats.totalGamesPlayed < 50 ? '💼' : 
                       stats.winRate > 70 ? '👑' : '🎯'}
                    </div>
                    <div className="text-xl font-bold">
                      {stats.totalGamesPlayed < 5 ? 'Novice Trader' : 
                       stats.totalGamesPlayed < 20 ? 'Rising Trader' : 
                       stats.totalGamesPlayed < 50 ? 'Experienced Trader' : 
                       stats.winRate > 70 ? 'Master Trader' : 'Expert Trader'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-black/40 border-yellow-400">
              <CardHeader>
                <CardTitle className="text-yellow-400">🏆 Achievements ({achievements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No achievements yet. Start playing to earn your first achievement!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-yellow-400 transition-colors"
                      >
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h3 className="font-bold text-yellow-400">{achievement.name}</h3>
                        <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge variant={achievement.rarity === 'common' ? 'secondary' : 
                                        achievement.rarity === 'uncommon' ? 'default' :
                                        achievement.rarity === 'rare' ? 'destructive' : 'outline'}>
                            {achievement.rarity}
                          </Badge>
                          <span className="text-xs text-gray-400">
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
            <Card className="bg-black/40 border-orange-400">
              <CardHeader>
                <CardTitle className="text-orange-400">🥇 Global Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-xl font-bold text-orange-400 mb-2">Leaderboard Coming Soon!</h3>
                  <p className="text-gray-400 mb-4">
                    The global leaderboard feature is currently under development.
                  </p>
                  <p className="text-sm text-gray-500">
                    For now, focus on improving your trading skills and check back later!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-black/40 border-gray-600">
              <CardHeader>
                <CardTitle>⚙️ Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
