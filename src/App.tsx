import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "motion/react";
import { GameSetup, GameConfig } from "./components/GameSetup";
import { BattleSystem } from "./components/BattleSystem";
import { Button } from "./components/ui/button";
import { gameApi } from "./services/gameApi";
import { AuthProvider } from "./contexts/AuthContext";
import LoginButton from "./components/auth/LoginButton";
import LogoutButton from "./components/auth/LogoutButton";
import UserProfile from "./components/auth/UserProfile";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";

type GamePhase = "start" | "setup" | "battle" | "complete";

interface RoundResult {
  round: number;
  playerScore: number;
  aiScore: number;
  winner: "player" | "ai" | "tie";
}

// Navigation Header Component
const NavigationHeader: React.FC = () => {
  const { isAuthenticated, user } = useAuth0();
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div
          className="text-2xl font-bold text-[#fff900] cursor-pointer hover:text-yellow-300 transition-colors"
          onClick={() => navigate("/")}
        >
          💵 STOCK FIGHTER
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/profile")}
                className="bg-[#00e1ff] text-white hover:bg-[#008698] hover:text-white"
              >
                Profile
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/game")}
                className="bg-[#fff900] text-black hover:bg-[#a19e00]"
              >
                Start Battle
              </Button>

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 text-white hover:text-yellow-400 cursor-pointer">
                  <img
                    src={user?.picture}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{user?.name}</span>
                  <span className="text-sm">▼</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-48">
                  <LogoutButton />
                </div>
              </div>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </div>
  );
};

// Game Component
const GameComponent: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>("start");
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [battleResults, setBattleResults] = useState<RoundResult[]>([]);
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // Initialize game state
  useEffect(() => {
    gameApi.initializeFromStorage();
  }, []);

  const startGame = () => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    setGamePhase("setup");
  };

  const handleGameSetup = (config: GameConfig) => {
    setGameConfig(config);
    setGamePhase("battle");
  };

  const handleBattleComplete = (results: RoundResult[]) => {
    setBattleResults(results);
    setGamePhase("complete");
  };

  const restartGame = () => {
    setGamePhase("start");
    setGameConfig(null);
    setBattleResults([]);
    gameApi.clearAuth();
  };

  if (gamePhase === "start") {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white scanlines pixel-font pt-20"
        style={{ backgroundColor: "#061625" }}
      >
        <div className="text-center max-w-4xl mx-auto p-8">
          {/* Title */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            className="mb-12"
          >
            <div className="text-8xl mt-4 mb-4 text-[#ff00e9]">
              STOCK FIGHTER
            </div>
            <div className="text-4xl text-[#00e1ff]">
              THE ULTIMATE TRADING BATTLE ARENA
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
          >
            <Button
              onClick={startGame}
              size="lg"
              className="border-4 neon-border-yellow text-black pixel-font text-3xl px-12 py-6 bg-yellow-400 hover:bg-yellow-300"
              style={{ backgroundColor: "#fff900" }}
            >
              🥊 START BATTLE
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gamePhase === "setup") {
    return <GameSetup onGameStart={handleGameSetup} />;
  }

  if (gamePhase === "battle" && gameConfig) {
    return (
      <BattleSystem
        gameConfig={gameConfig}
        onBattleComplete={handleBattleComplete}
      />
    );
  }

  if (gamePhase === "complete") {
    const playerWins = battleResults.filter(
      (r) => r.winner === "player"
    ).length;
    const aiWins = battleResults.filter((r) => r.winner === "ai").length;
    const finalWinner =
      playerWins > aiWins ? "player" : aiWins > playerWins ? "ai" : "tie";

    return (
      <div
        className="min-h-screen flex items-center justify-center text-white scanlines pixel-font pt-20"
        style={{ backgroundColor: "#061625" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto p-8"
        >
          <div
            className={`text-8xl mb-8 ${
              finalWinner === "player"
                ? "text-[#39ff14]"
                : finalWinner === "ai"
                ? "text-[#ff0000]"
                : "text-[#fff900]"
            }`}
          >
            {finalWinner === "player"
              ? "🏆 VICTORY!"
              : finalWinner === "ai"
              ? "💀 DEFEAT!"
              : "🤝 DRAW!"}
          </div>

          <div className="text-3xl mb-8 text-[#00e1ff]">
            FINAL SCORE: {playerWins} - {aiWins}
          </div>

          <Button
            onClick={restartGame}
            size="lg"
            className="border-4 border-[#fff900] text-black pixel-font text-3xl px-12 py-6 bg-[#fff900] hover:bg-[#989500]"
          >
            PLAY AGAIN
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
};

// Home Page Component
const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center text-white scanlines pixel-font pt-20"
      style={{ backgroundColor: "#061625" }}
    >
      <div className="text-center max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          className="mb-12"
        >
          <div className="text-8xl mt-4 mb-4 text-[#ff00e9]">STOCK FIGHTER</div>
          <div className="text-4xl text-[#00e1ff]">
            THE ULTIMATE TRADING BATTLE ARENA
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="border-4 neon-border-blue p-8 mb-8"
          style={{ backgroundColor: "rgba(6, 22, 37, 0.8)" }}
        >
          <h2 className="text-5xl mb-6 text-[#fff900] pixel-font">
            WELCOME TO THE ARENA
          </h2>
          <p className="text-xl mb-6">
            Battle against{" "}
            <span className="text-[#3399ff]">RBC InvestEase</span> AI in
            real-time trading competitions. Track your progress, earn
            achievements, and climb the{" "}
            <span className="text-[#99ff66]">leaderboard</span>!
          </p>

          <div className="flex flex-col gap-4 max-w-md mx-auto">
            {isAuthenticated ? (
              <>
                <div className="space-y-4 w-80 pixel-font">
                  {/* How to Play Button with Popup */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.3 }}
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="lg"
                          className="text-white pixel-font text-3xl py-5 bg-[#6100ff] hover:bg-[#4000a7] w-full"
                        >
                          How to play
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl border-4 neon-border-blue p-8 bg-black text-white pixel-font">
                        <DialogHeader>
                          <DialogTitle className="text-4xl mb-6 text-[#fff900]">
                            HOW TO PLAY
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">
                                👤
                              </span>
                              <div>
                                <p className="text-xl text-[#00e1ff]">ROUND 1:</p>{" "}
                                You have 30 seconds to trade stocks and maximize
                                your portfolio value
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">⚡</span>
                              <div>
                                <p className="text-xl text-[#00e1ff]">
                                  DYNAMIC MARKET:
                                </p>{" "}
                                Watch breaking news and character announcements
                                that affect stock prices
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">🤖</span>
                              <div>
                                <p className="text-xl text-[#fff900]">
                                  ROUND 2:
                                </p>{" "}
                                AI Trader takes its turn with the same market
                                conditions
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">🏆</span>
                              <div>
                                <p className="text-xl text-[#fff900]">
                                  VICTORY:
                                </p>{" "}
                                Highest portfolio value wins the battle!
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                </div>
                <Button
                  onClick={() => navigate("/game")}
                  size="lg"
                  className="text-black pixel-font text-3xl px-8 py-5 bg-[#fff900] hover:bg-[#a2a000]"
                >
                  START BATTLE
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-300">
                  Sign in to track your progress and compete on the leaderboard!
                </p>
                <LoginButton />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Main App Component with Routes
export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <NavigationHeader />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <GameComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}
