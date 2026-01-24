import { useEffect, useState } from "react";
import { usePlayerStore } from "../store";
import { isUnrealWebview, redirectToUnreal } from "../lib/redirect";
import { login, logout, getWalletAddress } from "../lib/web3auth";

// ============================================================================
// CREATOR (Trait Selection - clicking switches to creator mode)
// ============================================================================
const Creator = () => {
  const { mode, setMode, categories, currentCategory, customization, setCurrentCategory, changeAsset, updateSkin } = usePlayerStore();

  const handleCategoryClick = (category) => {
    setMode('creator');
    setCurrentCategory(category);
  };

  const currentCustomization = currentCategory ? customization[currentCategory.name] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'creator' && currentCategory?.id === cat.id
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Only show options when in creator mode */}
      {mode === 'creator' && currentCategory && (
        <>
          {/* Color palette (for skin) */}
          {currentCategory.colorPalette && (
            <div className="flex gap-2">
              {currentCategory.colorPalette.map((color) => (
                <button
                  key={color}
                  onClick={() => updateSkin(color)}
                  className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-white transition-colors"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* Asset grid */}
          <div className="flex gap-2 flex-wrap">
            {/* None/Remove option for removable categories */}
            {currentCategory.removable && (
              <button
                onClick={() => changeAsset(currentCategory.name, null)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 transition-all flex items-center justify-center ${
                  !currentCustomization?.asset
                    ? 'border-indigo-500 bg-gray-700'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <span className="text-gray-400 text-xs">None</span>
              </button>
            )}

            {currentCategory.assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => changeAsset(currentCategory.name, asset)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 transition-all ${
                  currentCustomization?.asset?.id === asset.id
                    ? 'border-indigo-500 bg-gray-700'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                }`}
              >
                {asset.thumbnail ? (
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-1">{asset.name}</span>
                )}
              </button>
            ))}
          </div>

          {/* Current selection */}
          <p className="text-gray-400 text-sm">
            {currentCategory.name}:{' '}
            <span className="text-white font-medium">
              {currentCustomization?.asset?.name || 'None'}
            </span>
          </p>
        </>
      )}
    </div>
  );
};

// ============================================================================
// PLAYER SELECT (Mascots + Created Characters)
// ============================================================================
const PlayerSelect = () => {
  const { players, selectedPlayer, selectPlayer, setMode } = usePlayerStore();

  const handleSelectPlayer = (player) => {
    setMode('demo');
    selectPlayer(player);
  };

  return (
    <div className="flex gap-4 justify-center flex-wrap">
      {/* Actual players */}
      {players.map((player) => (
        <button
          key={player.id}
          onClick={() => handleSelectPlayer(player)}
          className={`w-24 h-28 md:w-28 md:h-32 rounded-xl overflow-hidden transition-all border-4 duration-300 ${
            selectedPlayer?.id === player.id
              ? "border-indigo-500 scale-105"
              : "border-gray-600 hover:border-gray-500"
          }`}
        >
          {player.thumbnail ? (
            <img
              className="object-cover w-full h-full scale-125"
              src={player.thumbnail}
              alt={player.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xs font-medium">
              {player.name}
            </div>
          )}
        </button>
      ))}

      {/* Always show exactly 2 mystery boxes */}
      {[1, 2].map((i) => (
        <div
          key={`mystery-${i}`}
          className="w-24 h-28 md:w-28 md:h-32 rounded-xl border-4 border-gray-700 border-dashed bg-gray-800/50 flex items-center justify-center cursor-not-allowed"
        >
          <span className="text-4xl text-gray-600">?</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// TIER BADGE
// ============================================================================
const TierBadge = ({ tier }) => {
  if (tier === "none") return null;

  const colors = {
    whitelist: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    presale: "bg-green-500/20 text-green-400 border-green-500/50",
  };

  const labels = {
    whitelist: "Live-WL",
    presale: "Pre-Sale",
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[tier]}`}>
      {labels[tier]}
    </span>
  );
};

// ============================================================================
// SIGN IN BUTTON
// ============================================================================
const SignInButton = () => {
  const { user, setWallet, setTier } = usePlayerStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState(null);

  const handleSignIn = async () => {
    if (isUnrealWebview()) {
      const currentUrl = window.location.origin + window.location.pathname;
      const redirectUri = new URLSearchParams(window.location.search).get('redirect_uri') || '';
      const loginUrl = `https://milady-city-login.vercel.app?returnTo=${encodeURIComponent(currentUrl)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.location.href = loginUrl;
      return;
    }

    setIsSigningIn(true);
    setSignInError(null);

    try {
      await login();
      const address = await getWalletAddress();
      if (address) {
        setWallet(address);
        setTier("whitelist");
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setSignInError(error.message || "Sign in failed");
    }

    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setWallet(null);
      setTier("none");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (user.walletAddress) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400 text-sm">
              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </span>
          </div>
          <TierBadge tier={user.tier} />
        </div>
        <button
          onClick={handleSignOut}
          className="text-gray-500 hover:text-gray-400 text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white font-medium disabled:opacity-50"
        onClick={handleSignIn}
        disabled={isSigningIn}
      >
        {isSigningIn ? "Signing In..." : "Sign In"}
      </button>
      {signInError && (
        <p className="text-red-400 text-sm text-center">{signInError}</p>
      )}
    </div>
  );
};

// ============================================================================
// CREATE CHARACTER BUTTON
// ============================================================================
const CreateCharacterButton = () => {
  const { user } = usePlayerStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    // TODO: Implement mint logic
    console.log("Creating character...");
    setTimeout(() => setIsCreating(false), 2000);
  };

  return (
    <button
      className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors text-white font-medium disabled:opacity-50"
      onClick={handleCreate}
      disabled={isCreating || !user.walletAddress}
    >
      {isCreating ? "Creating..." : "Create Character"}
    </button>
  );
};

// ============================================================================
// CONTINUE TO GAME BUTTON
// ============================================================================
const ContinueToGameButton = () => {
  const { user, selectedPlayer, mode } = usePlayerStore();
  const isUnreal = isUnrealWebview();

  if (!user.walletAddress) {
    return null;
  }

  const handleContinue = () => {
    if (isUnreal) {
      // Pass full player object so Unreal knows the model URL
      redirectToUnreal(user.walletAddress, selectedPlayer);
    } else {
      alert(`Ready to play!\n\nWallet: ${user.walletAddress}\nMode: ${mode}\nPlayer: ${selectedPlayer?.name || 'None'}\nModel: ${selectedPlayer?.model || 'None'}`);
    }
  };

  return (
    <button
      className="w-full py-3 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors text-white font-medium"
      onClick={handleContinue}
    >
      {isUnreal ? "Continue to Game" : "Continue to Game →"}
    </button>
  );
};

// ============================================================================
// DOWNLOAD BUTTON (Only visible after sign-in)
// ============================================================================
const DownloadButton = () => {
  const { user } = usePlayerStore();
  const download = usePlayerStore((state) => state.download);

  // Only show after sign-in
  if (!user.walletAddress) {
    return null;
  }

  return (
    <button
      className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors text-white font-medium"
      onClick={download}
    >
      Download GLB
    </button>
  );
};

// ============================================================================
// LOADING SCREEN
// ============================================================================
const LoadingScreen = () => {
  const loading = usePlayerStore((state) => state.loading);

  return (
    <div
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-1000 ${
        loading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <img
        src="/images/dripp.png"
        className="w-32 md:w-40 animate-pulse"
        alt="Loading"
      />
    </div>
  );
};

// ============================================================================
// SIDEBAR
// ============================================================================
const Sidebar = () => {
  const { mode, selectedPlayer } = usePlayerStore();

  return (
    <aside className="w-full md:w-96 h-[50vh] md:h-full bg-gray-900/95 border-t md:border-t-0 md:border-l border-gray-800 overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <a href="https://remiliadrip.com">
            <img className="w-12 md:w-16" src="/images/dripp.png" alt="Logo" />
          </a>
          <h1 className="text-lg md:text-xl font-bold text-white">
            Remilia-Village
          </h1>
        </div>

        {/* Player Sign In (moved to top) */}
        <SignInButton />

        {/* Customize Character (Creator) */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Customize Character</h3>
          <Creator />
        </div>

        {/* Create Character Button */}
        <CreateCharacterButton />

        {/* Created Characters (Player Select) */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Created Characters</h3>
          <PlayerSelect />
          {mode === 'demo' && selectedPlayer && (
            <p className="text-center text-gray-400 text-sm mt-2">
              Selected: <span className="text-white font-medium">{selectedPlayer.name}</span>
            </p>
          )}
        </div>

        {/* Action Buttons (removed SignInButton from here) */}
        <div className="flex flex-col gap-3 mt-auto">
          <ContinueToGameButton />
          <DownloadButton />
        </div>
      </div>
    </aside>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================
export const UI = () => {
  return (
    <>
      <LoadingScreen />
      <Sidebar />
    </>
  );
};