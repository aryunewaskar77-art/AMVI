import fs from "fs";
import path from "path";
import type { Artwork } from "@/types/database.types";

const DATA_DIR = path.join(process.cwd(), "data");
const ARTWORKS_FILE = path.join(DATA_DIR, "artworks.json");

export const DEFAULT_SEED_ARTWORKS: Artwork[] = [
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c50",
    title: "Tree of Life (Kohbar)",
    artist_name: "Malvika Devi",
    description:
      "Exquisite Mithila/Madhubani masterpiece rendered with natural pigments, twigs, and fine nib pens on handmade lokta paper. Celebrates harmony, fertility, and cosmological continuity with intricate fish and peacocks interwoven across sacred branches.",
    price: 28500,
    medium: "Natural Dyes & Pigments on Handmade Lokta Paper",
    dimensions: "30 x 22 inches",
    image_url:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    is_available: true,
    created_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c51",
    title: "Celestial Ganesha",
    artist_name: "R. Ramanathan",
    description:
      "Classical Thanjavur (Tanjore) sacred portrait embossed with relief gesso paste, adorned with genuine 22-carat gold foil leafing and semi-precious Jaipur stones on treated teakwood board.",
    price: 64000,
    medium: "22K Gold Foil, Semi-Precious Stones & Gesso on Teakwood",
    dimensions: "24 x 18 inches",
    image_url:
      "https://images.unsplash.com/photo-1582561121160-c4887db5e4d2?auto=format&fit=crop&w=1200&q=80",
    is_available: true,
    created_at: "2026-10-02T10:00:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c52",
    title: "Monsoon Over the Ghats",
    artist_name: "Kavita Sen",
    description:
      "Vibrant contemporary modernist interpretation of twilight over the sacred Varanasi riverfront during heavy monsoon downpours. Built with thick textural palette knife impasto and golden ochre reflections.",
    price: 42000,
    medium: "Acrylic & Impasto Medium on Stretched Canvas",
    dimensions: "36 x 36 inches",
    image_url:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
    is_available: true,
    created_at: "2026-10-03T10:00:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c53",
    title: "Dusk at Chettinad Courtyard",
    artist_name: "Arjun Varma",
    description:
      "Atmospheric plein-air watercolor depicting the tranquil pillared verandah of an antique ancestral mansion in Tamil Nadu, capturing ambient warm light filtering through stone jali screens.",
    price: 19500,
    medium: "Winsor & Newton Artist Watercolors on 300gsm Arches Cold Press Paper",
    dimensions: "21 x 15 inches",
    image_url:
      "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80",
    is_available: true,
    created_at: "2026-10-04T10:00:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c54",
    title: "Resonance of the Raga (Bhairavi)",
    artist_name: "Tara Kulkarni",
    description:
      "Large-format expressive abstraction translating classical Indian morning ragas into rhythmically stratified tonal fields of crimson, cadmium yellow, and raw umber.",
    price: 52000,
    medium: "Archival Oil on Belgian Linen",
    dimensions: "48 x 36 inches",
    image_url:
      "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80",
    is_available: true,
    created_at: "2026-10-05T10:00:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c55",
    title: "The Lotus Pond of Mandu",
    artist_name: "Devendra Patwardhan",
    description:
      "Poetic balance between traditional miniature aesthetics and modern lyrical realism, capturing drifting pink lotus blossoms against emerald shadows on tranquil historical reservoir waters.",
    price: 34000,
    medium: "Acrylic and Gold Powder on Canvas",
    dimensions: "28 x 28 inches",
    image_url:
      "https://images.unsplash.com/photo-15797839002614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
    is_available: true,
    created_at: "2026-10-06T10:00:00.000Z",
  },
];

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ARTWORKS_FILE)) {
      fs.writeFileSync(
        ARTWORKS_FILE,
        JSON.stringify(DEFAULT_SEED_ARTWORKS, null, 2),
        "utf8"
      );
    }
  } catch (e) {
    console.error("[LocalArtworksStore] Failed to ensure data file:", e);
  }
}

export function getLocalArtworks(): Artwork[] {
  try {
    ensureDataFile();
    if (fs.existsSync(ARTWORKS_FILE)) {
      const raw = fs.readFileSync(ARTWORKS_FILE, "utf8");
      const list = JSON.parse(raw) as Artwork[];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.error("[LocalArtworksStore] Read error:", e);
  }
  return DEFAULT_SEED_ARTWORKS;
}

export function saveLocalArtwork(newPiece: Artwork): void {
  try {
    ensureDataFile();
    const existing = getLocalArtworks();
    const filtered = existing.filter((item) => item.id !== newPiece.id);
    const updated = [newPiece, ...filtered];
    fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(updated, null, 2), "utf8");
  } catch (e) {
    console.error("[LocalArtworksStore] Save error:", e);
  }
}

export function updateLocalArtworkAvailability(
  artworkId: string,
  isAvailable: boolean
): boolean {
  try {
    ensureDataFile();
    const existing = getLocalArtworks();
    let found = false;
    const updated = existing.map((item) => {
      if (item.id === artworkId) {
        found = true;
        return { ...item, is_available: isAvailable };
      }
      return item;
    });
    if (found) {
      fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(updated, null, 2), "utf8");
    }
    return found;
  } catch (e) {
    console.error("[LocalArtworksStore] Update error:", e);
    return false;
  }
}

export function deductArtworkStock(
  artworkId: string,
  decrementBy: number = 1
): { remainingQuantity: number; isOutOfStock: boolean } {
  try {
    ensureDataFile();
    const existing = getLocalArtworks();
    let remainingQuantity = 0;
    let isOutOfStock = true;

    const updated = existing.map((item) => {
      if (item.id === artworkId) {
        const currentQty =
          typeof item.quantity === "number" && item.quantity >= 0
            ? item.quantity
            : 1; // default to 1 piece if not explicitly set
        const newQty = Math.max(0, currentQty - decrementBy);
        remainingQuantity = newQty;
        isOutOfStock = newQty === 0;

        return {
          ...item,
          quantity: newQty,
          is_available: newQty > 0,
        };
      }
      return item;
    });

    fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(updated, null, 2), "utf8");
    return { remainingQuantity, isOutOfStock };
  } catch (e) {
    console.error("[LocalArtworksStore] deductArtworkStock error:", e);
    return { remainingQuantity: 0, isOutOfStock: true };
  }
}

export function updateLocalArtworkQuantity(
  artworkId: string,
  newQuantity: number
): boolean {
  try {
    ensureDataFile();
    const existing = getLocalArtworks();
    let found = false;
    const cleanQty = Math.max(0, Math.floor(newQuantity));

    const updated = existing.map((item) => {
      if (item.id === artworkId) {
        found = true;
        return {
          ...item,
          quantity: cleanQty,
          total_stock: Math.max(cleanQty, item.total_stock || cleanQty),
          is_available: cleanQty > 0,
        };
      }
      return item;
    });

    if (found) {
      fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(updated, null, 2), "utf8");
    }
    return found;
  } catch (e) {
    console.error("[LocalArtworksStore] updateLocalArtworkQuantity error:", e);
    return false;
  }
}

export function deleteLocalArtwork(artworkId: string): boolean {
  try {
    ensureDataFile();
    const existing = getLocalArtworks();
    const updated = existing.filter((item) => item.id !== artworkId);
    fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(updated, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[LocalArtworksStore] Delete error:", e);
    return false;
  }
}

