import { registerPlugin } from '@capacitor/core';

export interface PiPPlugin {
  enterPiP(): Promise<void>;
  isPipSupported(): Promise<{ isSupported: boolean }>;
  addListener(eventName: 'pipModeChanged', listenerFunc: (data: { isInPipMode: boolean }) => void): Promise<any>;
  removeListener(eventName: 'pipModeChanged', listenerFunc: (data: { isInPipMode: boolean }) => void): Promise<void>;
}

const PiP = registerPlugin<PiPPlugin>('PiP');

export default PiP;
