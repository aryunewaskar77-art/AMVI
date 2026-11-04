-- ==============================================================================
-- Seed: seed.sql
-- Description: 6 realistic Indian contemporary & traditional art pieces
--              (Madhubani, Tanjore, Modern Abstract, Acrylic, Watercolor, Oil on Linen)
-- ==============================================================================

INSERT INTO public.artworks (
  id,
  title,
  artist_name,
  description,
  price,
  medium,
  dimensions,
  image_url,
  is_available
)
VALUES
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c50',
    'Tree of Life (Kohbar)',
    'Malvika Devi',
    'Exquisite Mithila/Madhubani masterpiece rendered with natural pigments, twigs, and fine nib pens on handmade lokta paper. Celebrates harmony, fertility, and cosmological continuity with intricate fish and peacocks interwoven across sacred branches.',
    28500.00,
    'Natural Dyes & Pigments on Handmade Lokta Paper',
    '30 x 22 inches',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c51',
    'Celestial Ganesha',
    'R. Ramanathan',
    'Classical Thanjavur (Tanjore) sacred portrait embossed with relief gesso paste, adorned with genuine 22-carat gold foil leafing and semi-precious Jaipur stones on treated teakwood board.',
    64000.00,
    '22K Gold Foil, Semi-Precious Stones & Gesso on Teakwood',
    '24 x 18 inches',
    'https://images.unsplash.com/photo-1582561121160-c4887db5e4d2?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c52',
    'Monsoon Over the Ghats',
    'Kavita Sen',
    'Vibrant contemporary modernist interpretation of twilight over the sacred Varanasi riverfront during heavy monsoon downpours. Built with thick textural palette knife impasto and golden ochre reflections.',
    42000.00,
    'Acrylic & Impasto Medium on Stretched Canvas',
    '36 x 36 inches',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c53',
    'Dusk at Chettinad Courtyard',
    'Arjun Varma',
    'Atmospheric plein-air watercolor depicting the tranquil pillared verandah of an antique ancestral mansion in Tamil Nadu, capturing ambient warm light filtering through stone jali screens.',
    19500.00,
    'Winsor & Newton Artist Watercolors on 300gsm Arches Cold Press Paper',
    '21 x 15 inches',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c54',
    'Resonance of the Raga (Bhairavi)',
    'Tara Kulkarni',
    'Large-format expressive abstraction translating classical Indian morning ragas into rhythmically stratified tonal fields of crimson, cadmium yellow, and raw umber.',
    52000.00,
    'Archival Oil on Belgian Linen',
    '48 x 36 inches',
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80',
    true
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c55',
    'The Lotus Pond of Mandu',
    'Devendra Patwardhan',
    'Poetic balance between traditional miniature aesthetics and modern lyrical realism, capturing drifting pink lotus blossoms against emerald shadows on tranquil historical reservoir waters.',
    34000.00,
    'Acrylic and Gold Powder on Canvas',
    '28 x 28 inches',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  artist_name = EXCLUDED.artist_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  medium = EXCLUDED.medium,
  dimensions = EXCLUDED.dimensions,
  image_url = EXCLUDED.image_url,
  is_available = EXCLUDED.is_available;
