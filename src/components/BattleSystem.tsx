import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SimpleBattleSystem } from './SimpleBattleSystem';
import { GameConfig } from './GameSetup';
import { useAuthContext } from '../contexts/AuthContext';

interface RoundResult {
  round: number;
  playerScore: number;
  aiScore: number;
  winner: 'player' | 'ai' | 'tie';
}

interface BattleSystemProps {
  gameConfig: GameConfig;
  onBattleComplete: (results: RoundResult[]) => void;
}

export function BattleSystem({ gameConfig, onBattleComplete }: BattleSystemProps) {
  return (
    <SimpleBattleSystem
      gameConfig={gameConfig}
      onBattleComplete={onBattleComplete}
    />
  );
}