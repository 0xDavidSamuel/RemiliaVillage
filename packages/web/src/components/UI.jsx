import { useEffect, useState } from "react";
import { usePlayerStore } from "../store";
import { isUnrealWebview, redirectToUnreal } from "../lib/redirect";
import { login, logout, getWalletAddress, isConnected, web3auth } from "../lib/web3auth";

// ============================================================================
// PLAYER SELECT (2 Mascots)
// ============================================================================

const PlayerSelect = () => {
  const { players, selectedPlayer, selectPlayer } = usePlayerStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-center">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => selectPlayer(player)}
            className={`w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden transition-all border-4 duration-300 ${
              selectedPlayer?.id === player.id
                ? "border-indigo-500 scale-105"
                : "border-gray-600 hover:border-gray-500"
            }`}
          >
            {player.thumbnail ? (
              <img
                className="object-cover w-full h-full"
                src={player.thumbnail}
                alt={player.name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-sm font-medium">
                {player.name}
              </div>
            )}
          </button>
        ))}
      </div>
      {selectedPlayer && (
        <p className="text-center text-gray-400 text-sm">
          Selected: <span className="text-white font-medium">{selectedPlayer.name}</span>
        </p>
      )}
    </div>
  );
};

// ============================================================================
// GREYED OUT CREATOR (Coming Soon) - Shows real UI but disabled
// ============================================================================

const DisabledCreator = () => {
  const categories = ["Hair", "Eyes", "Mouth", "Brows", "Skin", "Hat", "Shirt", "Glasses", "Face Deco", "Neck"];

  return (
    <div className="opacity-40 pointer-events-none select-none">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-400"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Fake asset grid */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gray-800 border-2 border-gray-600"
          />
        ))}
      </div>

      {/* Color palette */}
      <div className="mt-4">
        <div className="flex gap-2">
          {['#f5c6a5', '#e8b094', '#d4956b', '#a57449', '#6b4423'].map((color) => (
            <div
              key={color}
              className="w-8 h-8 rounded-lg border-2 border-transparent"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
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
    whitelist: "Whitelist",
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
      const loginUrl = `https://remilia-village-login.vercel.app?returnTo=${encodeURIComponent(currentUrl)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
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
        setTier("whitelist"); // Free signup = whitelist
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

  // Already signed in
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

  // Sign in button
  return (
    <div className="flex flex-col gap-2">
      <button
        className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white font-medium disabled:opacity-50"
        onClick={handleSignIn}
        disabled={isSigningIn}
      >
        {isSigningIn ? "Signing In..." : "Sign In to Play"}
      </button>
      {signInError && (
        <p className="text-red-400 text-sm text-center">{signInError}</p>
      )}
    </div>
  );
};

// ============================================================================
// CONTINUE TO GAME BUTTON
// ============================================================================

const ContinueToGameButton = () => {
  const { user, selectedPlayer } = usePlayerStore();
  const isUnreal = isUnrealWebview();

  // Must be signed in and have selected a player
  if (!user.walletAddress || !selectedPlayer) {
    return null;
  }

  const handleContinue = () => {
    if (isUnreal) {
      redirectToUnreal(user.walletAddress, String(selectedPlayer.id));
    } else {
      alert(`Ready to play!\n\nWallet: ${user.walletAddress}\nPlayer: ${selectedPlayer.name}\nTier: ${user.tier}`);
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
// UPGRADE TO PRESALE (Optional)
// ============================================================================

const UpgradeButton = () => {
  const { user, setTier } = usePlayerStore();

  // Only show if whitelist (not presale yet)
  if (!user.walletAddress || user.tier !== "whitelist") {
    return null;
  }

  const handleUpgrade = () => {
    // TODO: Integrate $CULT payment
    alert("$CULT payment integration coming soon!\n\nThis will upgrade you to Pre-Sale tier for free minting at v1.0 launch.");
    // For testing:
    // setTier("presale");
  };

  return (
    <button
      className="w-full py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 transition-colors text-yellow-400 text-sm font-medium"
      onClick={handleUpgrade}
    >
      Upgrade to Pre-Sale ($CULT)
    </button>
  );
};

// ============================================================================
// DOWNLOAD BUTTON
// ============================================================================

const DownloadButton = () => {
  const download = usePlayerStore((state) => state.download);

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
  const { user, selectedPlayer } = usePlayerStore();

  return (
    <aside className="w-full md:w-96 h-[50vh] md:h-full bg-gray-900/95 border-t md:border-t-0 md:border-l border-gray-800 overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <a href="https://remiliadrip.com">
            <img className="w-12 md:w-16" src="/images/dripp.png" alt="Logo" />
          </a>
          <h1 className="text-lg md:text-xl font-bold text-white">Select Player</h1>
        </div>

        {/* Player Select */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Choose Your Character</h3>
          <PlayerSelect />
        </div>

        {/* Greyed Out Creator */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Customize</h3>
          <DisabledCreator />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-auto">
          <SignInButton />
          <UpgradeButton />
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
