import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { gameApi, TeamRegistration } from '../services/gameApi';

interface GameSetupProps {
  onGameStart: (config: GameConfig) => void;
}

export interface GameConfig {
  timeframe: number; // in days
  goal: string;
  cost: number;
  initialCash: number;
  teamName: string;
  contactEmail: string;
}

const TIMEFRAME_OPTIONS = [
  { label: '1 Week', value: 7, days: 7 },
  { label: '2 Weeks', value: 14, days: 14 },
  { label: '1 Month', value: 30, days: 30 },
  { label: '3 Months', value: 90, days: 90 },
  { label: '6 Months', value: 180, days: 180 },
  { label: '1 Year', value: 365, days: 365 },
];

const GOAL_EXAMPLES = [
  'Buy a new gaming setup',
  'Save for vacation',
  'Emergency fund',
  'Down payment for house',
  'Retirement savings',
  'Education fund',
  'Wedding expenses',
  'Business investment',
];

export function GameSetup({ onGameStart }: GameSetupProps) {
  const [teamName, setTeamName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [timeframe, setTimeframe] = useState(30);
  const [goal, setGoal] = useState('');
  const [cost, setCost] = useState(0);
  const [initialCash, setInitialCash] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = async () => {
    if (!teamName || !contactEmail || !goal || cost <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Register team with RBC InvestEase API
      const teamData: TeamRegistration = {
        team_name: teamName,
        contact_email: contactEmail,
      };

      await gameApi.registerTeam(teamData);

      const gameConfig: GameConfig = {
        timeframe,
        goal,
        cost,
        initialCash,
        teamName,
        contactEmail,
      };

      onGameStart(gameConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalSelect = (selectedGoal: string) => {
    setGoal(selectedGoal);
    // Set a reasonable cost based on the goal
    const costMap: Record<string, number> = {
      'Buy a new gaming setup': 3000,
      'Save for vacation': 5000,
      'Emergency fund': 10000,
      'Down payment for house': 50000,
      'Retirement savings': 100000,
      'Education fund': 25000,
      'Wedding expenses': 20000,
      'Business investment': 15000,
    };
    setCost(costMap[selectedGoal] || 0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font" style={{backgroundColor: '#061625'}}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto p-8 mt-[5rem]"
      >
        {/* Title */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4 text-[#ff00e9]">
            STOCK FIGHTER
          </div>
          <div className="text-3xl text-[#00e1ff]">
            CONFIGURE YOUR BATTLE
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Team Setup */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-4 border-[#00e1ff]" style={{backgroundColor: 'rgba(6, 22, 37, 0.9)'}}>
              <CardHeader>
                <CardTitle className="text-[#fff900] text-3xl">TEAM SETUP</CardTitle>
                <CardDescription className="text-gray-300">
                  Register your team for the RBC InvestEase API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="teamName" className="text-[#00e1ff] mb-2 text-xl ">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    className=""
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail" className="text-[#00e1ff] text-xl mb-2">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="team@example.com"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Configuration */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-4 border-[#ff00e9]" style={{backgroundColor: 'rgba(6, 22, 37, 0.9)'}}>
              <CardHeader>
                <CardTitle className="text-[#ff00e9] text-3xl">BATTLE CONFIG</CardTitle>
                <CardDescription className="text-gray-300">
                  Set your investment challenge parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[#fff900] text-xl mb-2">Investment Goal *</Label>
                  <Select onValueChange={handleGoalSelect}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_EXAMPLES.map((goalOption) => (
                        <SelectItem key={goalOption} value={goalOption}>
                          {goalOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {goal && (
                    <div className="mt-2">
                      <Label htmlFor="goalCost" className="text-[#00e1ff]">Goal Cost ($) *</Label>
                      <Input
                        id="goalCost"
                        type="number"
                        value={cost}
                        onChange={(e) => setCost(Number(e.target.value))}
                        placeholder="Enter cost amount"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-[#fff900] text-xl mb-2">Time Frame *</Label>
                  <Select value={timeframe.toString()} onValueChange={(value: any) => setTimeframe(Number(value))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="initialCash" className="text-[#00e1ff] text-xl mb-2">Starting Cash ($)</Label>
                  <Input
                    id="initialCash"
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(Number(e.target.value))}
                    placeholder="10000"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Game Rules */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="border-4 border-[#fff900]" style={{backgroundColor: 'rgba(6, 22, 37, 0.9)'}}>
            <CardHeader>
              <CardTitle className="text-[#fff900] text-3xl">BATTLE RULES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg text-white">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400"></span>
                  <div>
                    <strong className="text-[#00e1ff]">REAL-TIME:</strong> 1 second = 0.5 days in game
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400"></span>
                  <div>
                    <strong className="text-[#ff00e9]">GOAL:</strong> Reach your target amount in time
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400"></span>
                  <div>
                    <strong className="text-[#fff900]">BATTLE:</strong> Best of 3 rounds vs AI
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-4 mb-4 p-4 border-2 border-red-500 bg-red-900/20 rounded-lg"
          >
            <p className="text-red-400 text-center">{error}</p>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <Button
            onClick={handleStartGame}
            disabled={isLoading}
            size="lg"
            className="border-4 border-[#fff900] text-black mt-[2rem] pixel-font text-3xl px-12 py-6 bg-[#fff900] hover:bg-[#bfbc00] disabled:opacity-50"
          >
            {isLoading ? '⚡ INITIALIZING...' : 'START BATTLE'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
