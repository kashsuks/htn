import { ThreeWayBattleSystem } from './ThreeWayBattleSystem';
import { GameConfig } from './GameSetup';

interface BattleResults {
  human: {
    finalValue: number;
    totalReturn: number;
  };
  autonomousAI: {
    finalValue: number;
    totalReturn: number;
  };
  investEase: {
    finalValue: number;
    totalReturn: number;
    strategy: string;
  };
  winner: 'human' | 'autonomousAI' | 'investease';
}

interface BattleSystemProps {
  gameConfig: GameConfig;
  onBattleComplete: (results: BattleResults) => void;
}

export function BattleSystem({ gameConfig, onBattleComplete }: BattleSystemProps) {
  return (
    <ThreeWayBattleSystem
      gameConfig={gameConfig}
      onBattleComplete={onBattleComplete}
    />
  );
}