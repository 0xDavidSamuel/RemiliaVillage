import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x14a34",
  rpcTarget: "https://sepolia.base.org",
  displayName: "Base Sepolia",
  blockExplorerUrl: "https://sepolia.basescan.org",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
  uiConfig: {
    mode: "light",
    loginMethodsOrder: ["google", "apple", "email_passwordless"],
  },
});

export async function initWeb3Auth() {
  console.log("[Web3Auth] Initializing...");
  await web3auth.initModal();
  console.log("[Web3Auth] Initialized, connected:", web3auth.connected);
  return web3auth;
}

export async function login() {
  console.log("[Web3Auth] Login called, connected:", web3auth.connected);
  if (!web3auth.connected) {
    try {
      console.log("[Web3Auth] Calling connect...");
      const provider = await web3auth.connect();
      console.log("[Web3Auth] Connect returned, provider:", !!provider);
      console.log("[Web3Auth] Now connected:", web3auth.connected);
      return provider;
    } catch (error) {
      console.error("[Web3Auth] Connect failed:", error);
      throw error;
    }
  }
  console.log("[Web3Auth] Already connected, returning provider");
  return web3auth.provider;
}

export async function logout() {
  console.log("[Web3Auth] Logout called");
  if (web3auth.connected) {
    await web3auth.logout();
    console.log("[Web3Auth] Logged out");
  }
}

export function getProvider() {
  return web3auth.provider;
}

export function isConnected() {
  return web3auth.connected;
}

export async function getWalletAddress(): Promise<string | null> {
  if (!web3auth.provider) return null;

  try {
    const accounts = await web3auth.provider.request({
      method: "eth_accounts",
    });
    return (accounts as string[])?.[0] || null;
  } catch (error) {
    console.error("[Web3Auth] Failed to get wallet address:", error);
    return null;
  }
}
