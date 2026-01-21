const UNREAL_SESSION_KEY = 'miladycity_from_unreal';

// Check if we're being loaded from Unreal webview
export function isUnrealWebview(): boolean {
  // Check URL first
  const params = new URLSearchParams(window.location.search);
  if (params.has('redirect_uri')) {
    // Store flag for later
    try {
      sessionStorage.setItem(UNREAL_SESSION_KEY, 'true');
    } catch (e) {}
    return true;
  }
  // Check sessionStorage (for after URL cleanup)
  try {
    return sessionStorage.getItem(UNREAL_SESSION_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

// Get the redirect URI (passed from Unreal)
export function getRedirectUri(): string | null {
  // Check URL first
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('redirect_uri');
  if (fromUrl) {
    // Store for later
    try {
      sessionStorage.setItem('miladycity_redirect_uri', fromUrl);
    } catch (e) {}
    return fromUrl;
  }
  // Check sessionStorage
  try {
    return sessionStorage.getItem('miladycity_redirect_uri');
  } catch (e) {
    return null;
  }
}

// Redirect back to Unreal with wallet and optional player ID
export function redirectToUnreal(walletAddress: string, playerId?: string): void {
  const redirectUri = getRedirectUri();
  if (!redirectUri) {
    console.error("[redirect] No redirect URI found");
    return;
  }
  let url = `${redirectUri}?wallet=${walletAddress}`;
  if (playerId) {
    url += `&player=${playerId}`;
  }
  // Clear session data
  try {
    sessionStorage.removeItem(UNREAL_SESSION_KEY);
    sessionStorage.removeItem('miladycity_redirect_uri');
  } catch (e) {}
  window.location.href = url;
}
