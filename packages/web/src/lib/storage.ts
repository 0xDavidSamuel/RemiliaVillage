import { NFTStorage, File } from "nft.storage";

const client = new NFTStorage({
  token: import.meta.env.VITE_NFT_STORAGE_API_KEY,
});

export interface PlayerTraits {
  skin: number;
  neck: number;
  faceDeco: number;
  face: number;
  brows: number;
  mouth: number;
  earrings: number;
  eyeColor: number;
  eyes: number;
  hair: number;
  glasses: number;
  shirt: number;
  hat: number;
}

export interface PlayerMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * IPFS Gateway URL converter
 */
export function ipfsToHttp(ipfsUri: string): string {
  if (!ipfsUri) return "";
  if (ipfsUri.startsWith("ipfs://")) {
    return ipfsUri.replace("ipfs://", "https://nftstorage.link/ipfs/");
  }
  return ipfsUri;
}

/**
 * Fetch JSON from IPFS
 */
export async function fetchFromIPFS<T>(ipfsUri: string): Promise<T> {
  const httpUrl = ipfsToHttp(ipfsUri);
  const response = await fetch(httpUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Upload categories JSON to IPFS
 */
export async function uploadCategories(categories: any): Promise<string> {
  const blob = new Blob([JSON.stringify(categories)], { type: "application/json" });
  const file = new File([blob], "categories.json", { type: "application/json" });
  const cid = await client.storeBlob(file);
  return `ipfs://${cid}`;
}

/**
 * Generate trait hash for uniqueness checking
 */
export function generateTraitHash(traits: PlayerTraits): `0x${string}` {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    `${traits.skin}-${traits.neck}-${traits.faceDeco}-${traits.face}-${traits.brows}-${traits.mouth}-${traits.earrings}-${traits.eyeColor}-${traits.eyes}-${traits.hair}-${traits.glasses}-${traits.shirt}-${traits.hat}`
  );

  let hash = 0n;
  for (const byte of data) {
    hash = (hash * 31n + BigInt(byte)) % (2n ** 256n);
  }

  return `0x${hash.toString(16).padStart(64, "0")}`;
}

/**
 * Upload player thumbnail image
 */
export async function uploadImage(imageBlob: Blob, filename: string): Promise<string> {
  const file = new File([imageBlob], filename, { type: imageBlob.type });
  const cid = await client.storeBlob(file);
  return `ipfs://${cid}`;
}

/**
 * Upload GLB model file
 */
export async function uploadModel(glbBlob: Blob, filename: string): Promise<string> {
  const file = new File([glbBlob], filename, { type: "model/gltf-binary" });
  const cid = await client.storeBlob(file);
  return `ipfs://${cid}`;
}

/**
 * Upload complete player metadata (NFT standard)
 */
export async function uploadMetadata(
  name: string,
  description: string,
  traits: PlayerTraits,
  imageUrl: string,
  modelUrl?: string
): Promise<string> {
  const metadata: PlayerMetadata = {
    name,
    description,
    image: imageUrl,
    attributes: [
      { trait_type: "Skin", value: traits.skin },
      { trait_type: "Neck", value: traits.neck },
      { trait_type: "Face Deco", value: traits.faceDeco },
      { trait_type: "Face", value: traits.face },
      { trait_type: "Brows", value: traits.brows },
      { trait_type: "Mouth", value: traits.mouth },
      { trait_type: "Earrings", value: traits.earrings },
      { trait_type: "Eye Color", value: traits.eyeColor },
      { trait_type: "Eyes", value: traits.eyes },
      { trait_type: "Hair", value: traits.hair },
      { trait_type: "Glasses", value: traits.glasses },
      { trait_type: "Shirt", value: traits.shirt },
      { trait_type: "Hat", value: traits.hat },
    ],
  };

  if (modelUrl) {
    metadata.animation_url = modelUrl;
  }

  const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
  const file = new File([blob], "metadata.json", { type: "application/json" });
  const cid = await client.storeBlob(file);

  return `ipfs://${cid}`;
}

/**
 * Upload everything and return metadata URI + trait hash
 */
export async function uploadPlayer(
  name: string,
  description: string,
  traits: PlayerTraits,
  thumbnailBlob: Blob,
  modelBlob?: Blob
): Promise<{ metadataUri: string; traitHash: `0x${string}` }> {
  const imageUrl = await uploadImage(thumbnailBlob, `${name}-thumbnail.png`);

  let modelUrl: string | undefined;
  if (modelBlob) {
    modelUrl = await uploadModel(modelBlob, `${name}-model.glb`);
  }

  const metadataUri = await uploadMetadata(name, description, traits, imageUrl, modelUrl);
  const traitHash = generateTraitHash(traits);

  return { metadataUri, traitHash };
}
