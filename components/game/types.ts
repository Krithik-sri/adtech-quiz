
import { UpgradeType } from '../../types';

export type EntityType = 'PLAYER' | 'ENEMY_PREMIUM' | 'ENEMY_BOT' | 'BULLET' | 'PARTICLE';

export interface GameObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  hp: number;
  maxHp?: number;
  color: string;
  type: EntityType;
  iframeTimer?: number;
  life?: number;
  maxLife?: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface GameConfig {
  width: number;
  height: number;
  activeBuff: 'NONE' | 'OVERCLOCK' | 'LAG';
  activeUpgrades: UpgradeType[];
}
