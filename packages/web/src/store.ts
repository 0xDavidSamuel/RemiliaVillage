import { create } from 'zustand';
import { MeshStandardMaterial } from 'three';

// ============================================================================
// DEMO MODE - Player Select (2 Mascots)
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

const DEMO_PLAYERS: Player[] = [
  {
    id: 1,
    name: 'Mascot V1',
    description: 'The original',
    model: '/models/mascot-v1.glb',
    thumbnail: '/images/mascot-v1.png',
  },
  {
    id: 2,
    name: 'Mascot V2',
    description: 'The variant',
    model: '/models/mascot-v2.glb',
    thumbnail: '/images/mascot-v2.png',
  },
];

// ============================================================================
// FULL CREATOR MODE - Uncomment when ready for v1.0
// ============================================================================

/*
import { fetchFromIPFS, ipfsToHttp, type AvatarTraits } from './lib/storage';

const CATEGORIES_IPFS_URI = import.meta.env.VITE_CATEGORIES_IPFS_URI || null;

interface Asset {
  id: number;
  name: string;
  thumbnail?: string;
  model?: string;
  lockedGroups?: string[];
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

interface LockedGroups {
  [key: string]: Array<{ name: string; categoryName: string }>;
}

interface CategoriesData {
  categories: Category[];
}

const FALLBACK_CATEGORIES: Category[] = [
  // ============ MANDATORY CATEGORIES ============
  {
    id: 'skin',
    name: 'Skin',
    position: 0,
    assets: [
      { id: 0, name: 'Pale' },
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
  // ============ OPTIONAL/REMOVABLE CATEGORIES ============
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
    id: 'face',
    name: 'Face',
    position: 8,
    assets: [],
    removable: true,
  },
  {
    id: 'faceDeco',
    name: 'Face Deco',
    position: 9,
    assets: [
      { id: 0, name: 'Star Heart Tattoo', model: '/models/facedeco-0.glb' },
    ],
    startingAsset: 0,
    removable: true,
  },
  {
    id: 'neck',
    name: 'Neck',
    position: 10,
    assets: [
      { id: 0, name: 'Lean Neck Tattoo', model: '/models/neck-0.glb' },
    ],
    startingAsset: 0,
    removable: true,
  },
  {
    id: 'earrings',
    name: 'Earrings',
    position: 11,
    assets: [],
    removable: true,
  },
];
*/

// ============================================================================
// STORE - DEMO MODE
// ============================================================================

interface PlayerState {
  // Demo state
  loading: boolean;
  error: string | null;
  players: Player[];
  selectedPlayer: Player | null;
  user: User;
  skin: MeshStandardMaterial;
  download: () => void;
  setDownload: (fn: () => void) => void;
  initialize: () => void;
  selectPlayer: (player: Player) => void;
  setWallet: (address: string | null) => void;
  setTier: (tier: 'none' | 'whitelist' | 'presale') => void;

  /* FULL CREATOR MODE - Uncomment for v1.0
  categories: Category[];
  currentCategory: Category | null;
  assets: Asset[];
  customization: Customization;
  lockedGroups: LockedGroups;
  fetchCategories: () => Promise<void>;
  setCurrentCategory: (category: Category) => void;
  changeAsset: (category: string, asset: Asset | null) => void;
  getTraitsForMint: () => AvatarTraits;
  getAssetUrl: (uri: string) => string;
  updateColor: (color: string) => void;
  updateSkin: (color: string) => void;
  applyLockedAssets: () => void;
  */
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // ============================================================================
  // DEMO STATE
  // ============================================================================
  loading: true,
  error: null,
  players: [],
  selectedPlayer: null,
  user: {
    walletAddress: null,
    tier: 'none',
  },
  skin: new MeshStandardMaterial({ color: 0xf5c6a5, roughness: 1 }),
  download: () => {},

  setDownload: (fn: () => void) => set({ download: fn }),

  // Initialize demo with 2 mascots
  initialize: () => {
    set({
      players: DEMO_PLAYERS,
      selectedPlayer: DEMO_PLAYERS[0],
      loading: false,
      error: null,
    });
  },

  // Select a player (mascot v1 or v2)
  selectPlayer: (player: Player) => {
    set({ selectedPlayer: player });
  },

  // Set wallet address (from Web3Auth)
  setWallet: (address: string | null) => {
    set((state) => ({
      user: {
        ...state.user,
        walletAddress: address,
        tier: address ? 'whitelist' : 'none',
      },
    }));
  },

  // Set tier (whitelist → presale via $CULT payment)
  setTier: (tier: 'none' | 'whitelist' | 'presale') => {
    set((state) => ({
      user: {
        ...state.user,
        tier,
      },
    }));
  },

  // ============================================================================
  // FULL CREATOR MODE - Uncomment for v1.0
  // ============================================================================

  /*
  categories: [],
  currentCategory: null,
  assets: [],
  customization: {},
  lockedGroups: {},

  fetchCategories: async () => {
    set({ loading: true, error: null });

    try {
      let categories: Category[];

      if (CATEGORIES_IPFS_URI) {
        const data = await fetchFromIPFS<CategoriesData>(CATEGORIES_IPFS_URI);
        categories = data.categories;
      } else {
        categories = FALLBACK_CATEGORIES;
      }

      categories.sort((a, b) => a.position - b.position);

      const assets = categories.flatMap((cat) =>
        cat.assets.map((asset) => ({ ...asset, categoryId: cat.id }))
      );

      const customization: Customization = {};
      categories.forEach((category) => {
        let startingAsset: Asset | null = null;

        if (category.startingAsset !== undefined && category.assets.length > 0) {
          startingAsset = category.assets.find((a) => a.id === category.startingAsset) || category.assets[0];
        } else if (category.assets.length > 0 && !category.removable) {
          startingAsset = category.assets[0];
        }

        customization[category.name] = {
          asset: startingAsset,
          color: category.colorPalette?.[0] || undefined,
        };
      });

      set({
        categories,
        currentCategory: categories[0],
        assets,
        customization,
        loading: false,
      });

      get().applyLockedAssets();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  setCurrentCategory: (category: Category) => set({ currentCategory: category }),

  changeAsset: (category: string, asset: Asset | null) => {
    set((state) => ({
      customization: {
        ...state.customization,
        [category]: {
          ...state.customization[category],
          asset,
        },
      },
    }));
    get().applyLockedAssets();
  },

  updateColor: (color: string) => {
    const currentCategory = get().currentCategory;
    if (!currentCategory) return;

    set((state) => ({
      customization: {
        ...state.customization,
        [currentCategory.name]: {
          ...state.customization[currentCategory.name],
          color,
        },
      },
    }));

    if (currentCategory.name === 'Skin') {
      get().skin.color.set(color);
    }
  },

  updateSkin: (color: string) => {
    get().skin.color.set(color);
  },

  applyLockedAssets: () => {
    const customization = get().customization;
    const categories = get().categories;
    const lockedGroups: LockedGroups = {};

    Object.entries(customization).forEach(([categoryName, categoryData]) => {
      if (categoryData.asset?.lockedGroups) {
        categoryData.asset.lockedGroups.forEach((groupId) => {
          const lockedCategory = categories.find((cat) => cat.id === groupId);
          if (lockedCategory) {
            if (!lockedGroups[lockedCategory.name]) {
              lockedGroups[lockedCategory.name] = [];
            }
            lockedGroups[lockedCategory.name].push({
              name: categoryData.asset!.name,
              categoryName,
            });
          }
        });
      }
    });

    set({ lockedGroups });
  },

  getTraitsForMint: (): AvatarTraits => {
    const { customization } = get();

    return {
      skin: customization['Skin']?.asset?.id ?? 0,
      neck: customization['Neck']?.asset?.id ?? 0,
      faceDeco: customization['Face Deco']?.asset?.id ?? 0,
      face: customization['Face']?.asset?.id ?? 0,
      brows: customization['Brows']?.asset?.id ?? 0,
      mouth: customization['Mouth']?.asset?.id ?? 0,
      earrings: customization['Earrings']?.asset?.id ?? 0,
      eyeColor: 0,
      eyes: customization['Eyes']?.asset?.id ?? 0,
      hair: customization['Hair']?.asset?.id ?? 0,
      glasses: customization['Glasses']?.asset?.id ?? 0,
      shirt: customization['Shirt']?.asset?.id ?? 0,
      hat: customization['Hat']?.asset?.id ?? 0,
    };
  },

  getAssetUrl: (uri: string) => {
    if (uri.startsWith('/')) {
      return uri;
    }
    return ipfsToHttp(uri);
  },
  */
}));
