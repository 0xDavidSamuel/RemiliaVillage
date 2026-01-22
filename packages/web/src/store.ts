import { create } from 'zustand';
import { MeshStandardMaterial } from 'three';

// ============================================================================
// TYPES
// ============================================================================

interface Player {
  id: number;
  name: string;
  description: string;
  model: string;
  thumbnail: string;
}

interface User {
  walletAddress: string | null;
  tier: 'none' | 'whitelist' | 'presale';
}

interface Asset {
  id: number;
  name: string;
  thumbnail?: string;
  model?: string;
}

interface Category {
  id: string;
  name: string;
  position: number;
  assets: Asset[];
  removable?: boolean;
  colorPalette?: string[];
  startingAsset?: number;
}

interface Customization {
  [key: string]: {
    asset: Asset | null;
    color?: string;
  };
}

// ============================================================================
// DATA
// ============================================================================

const DEMO_PLAYERS: Player[] = [
  {
    id: 1,
    name: 'Drippy',
    description: 'The original',
    model: '/models/mascot-v1.glb',
    thumbnail: '/images/mascot-v1.png',
  },
  {
    id: 2,
    name: 'Milady',
    description: 'The variant',
    model: '/models/mascot-v2.glb',
    thumbnail: '/images/mascot-v2.png',
  },
];

const CREATOR_CATEGORIES: Category[] = [
  {
    id: 'skin',
    name: 'Skin',
    position: 0,
    assets: [
      { id: 0, name: 'Default' },
    ],
    startingAsset: 0,
    colorPalette: ['#f5c6a5', '#e8b094', '#d4956b', '#a57449', '#6b4423'],
  },
  {
    id: 'hair',
    name: 'Hair',
    position: 1,
    assets: [
      { id: 0, name: 'Short Blonde', model: '/models/hair-0.glb' },
    ],
    startingAsset: 0,
  },
  {
    id: 'eyes',
    name: 'Eyes',
    position: 2,
    assets: [
      { id: 0, name: 'Dilated', model: '/models/eyes-0.glb' },
    ],
    startingAsset: 0,
  },
  {
    id: 'brows',
    name: 'Brows',
    position: 3,
    assets: [
      { id: 0, name: 'Flat', model: '/models/brows-0.glb' },
    ],
    startingAsset: 0,
  },
  {
    id: 'mouth',
    name: 'Mouth',
    position: 4,
    assets: [
      { id: 0, name: 'Smile A', model: '/models/mouth-0.glb' },
    ],
    startingAsset: 0,
  },
  {
    id: 'hat',
    name: 'Hat',
    position: 5,
    assets: [
      { id: 0, name: 'Denim USA Cap', model: '/models/hat-0.glb' },
    ],
    startingAsset: 0,
    removable: true,
  },
  {
    id: 'shirt',
    name: 'Shirt',
    position: 6,
    assets: [
      { id: 0, name: 'MWO Shirt', model: '/models/shirt-0.glb' },
    ],
    startingAsset: 0,
    removable: true,
  },
  {
    id: 'glasses',
    name: 'Glasses',
    position: 7,
    assets: [
      { id: 0, name: 'Prescription Glasses', model: '/models/glasses-0.glb' },
    ],
    startingAsset: 0,
    removable: true,
  },
  {
    id: 'faceDeco',
    name: 'Face Deco',
    position: 8,
    assets: [
      { id: 0, name: 'Star Heart Tattoo', model: '/models/facedeco-0.glb' },
    ],
    removable: true,
  },
  {
    id: 'neck',
    name: 'Neck',
    position: 9,
    assets: [
      { id: 0, name: 'Lean Neck Tattoo', model: '/models/neck-0.glb' },
    ],
    removable: true,
  },
];

// ============================================================================
// STORE
// ============================================================================

interface PlayerState {
  // Mode
  mode: 'demo' | 'creator';
  setMode: (mode: 'demo' | 'creator') => void;
  
  // Common
  loading: boolean;
  error: string | null;
  user: User;
  skin: MeshStandardMaterial;
  download: () => void;
  setDownload: (fn: () => void) => void;
  setWallet: (address: string | null) => void;
  setTier: (tier: 'none' | 'whitelist' | 'presale') => void;
  
  // Demo mode
  players: Player[];
  selectedPlayer: Player | null;
  selectPlayer: (player: Player) => void;
  
  // Creator mode
  categories: Category[];
  currentCategory: Category | null;
  customization: Customization;
  setCurrentCategory: (category: Category) => void;
  changeAsset: (categoryName: string, asset: Asset | null) => void;
  updateSkin: (color: string) => void;
  
  // Init
  initialize: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // ============================================================================
  // MODE
  // ============================================================================
  mode: 'demo',
  setMode: (mode) => set({ mode }),

  // ============================================================================
  // COMMON STATE
  // ============================================================================
  loading: true,
  error: null,
  user: {
    walletAddress: null,
    tier: 'none',
  },
  skin: new MeshStandardMaterial({ color: 0xf5c6a5, roughness: 1 }),
  download: () => {},
  setDownload: (fn) => set({ download: fn }),

  setWallet: (address) => {
    set((state) => ({
      user: {
        ...state.user,
        walletAddress: address,
        tier: address ? 'whitelist' : 'none',
      },
    }));
  },

  setTier: (tier) => {
    set((state) => ({
      user: {
        ...state.user,
        tier,
      },
    }));
  },

  // ============================================================================
  // DEMO MODE
  // ============================================================================
  players: [],
  selectedPlayer: null,
  
  selectPlayer: (player) => {
    set({ selectedPlayer: player });
  },

  // ============================================================================
  // CREATOR MODE
  // ============================================================================
  categories: [],
  currentCategory: null,
  customization: {},

  setCurrentCategory: (category) => set({ currentCategory: category }),

  changeAsset: (categoryName, asset) => {
    set((state) => ({
      customization: {
        ...state.customization,
        [categoryName]: {
          ...state.customization[categoryName],
          asset,
        },
      },
    }));
  },

  updateSkin: (color: string) => {
    get().skin.color.set(color);
  },

  // ============================================================================
  // INITIALIZE
  // ============================================================================
  initialize: () => {
    const players = DEMO_PLAYERS;
    const categories = CREATOR_CATEGORIES;
    const customization: Customization = {};
    
    categories.forEach((category) => {
      let startingAsset: Asset | null = null;
      
      if (category.startingAsset !== undefined && category.assets.length > 0) {
        startingAsset = category.assets.find((a) => a.id === category.startingAsset) || null;
      }
      
      customization[category.name] = {
        asset: startingAsset,
        color: category.colorPalette?.[0],
      };
    });

    set({
      players,
      selectedPlayer: players[0],
      categories,
      currentCategory: categories[0],
      customization,
      loading: false,
      error: null,
    });
  },
}));