// Catálogo de servicios/amenidades propios del espacio.
// Se usa tanto en el formulario del proveedor (CreateSpace)
// como en la vista de detalle del usuario (VenueDetail).

export interface AmenityDef {
  key: string;   // valor que se persiste en DB (venues.amenities: text[])
  label: string; // texto visible
  icon: string;  // nombre de material-icons-outlined
}

export const AMENITIES: AmenityDef[] = [
  { key: 'wifi',           label: 'WiFi',                 icon: 'wifi' },
  { key: 'ac',             label: 'Aire acondicionado',   icon: 'ac_unit' },
  { key: 'heating',        label: 'Calefacción',          icon: 'whatshot' },
  { key: 'parking',        label: 'Estacionamiento',      icon: 'local_parking' },
  { key: 'valet',          label: 'Valet parking',        icon: 'directions_car' },
  { key: 'furniture',      label: 'Mobiliario',           icon: 'chair' },
  { key: 'audio',          label: 'Equipo de audio',      icon: 'speaker' },
  { key: 'lighting',       label: 'Iluminación',          icon: 'lightbulb' },
  { key: 'security',       label: 'Seguridad',            icon: 'security' },
  { key: 'kitchen',        label: 'Cocina',               icon: 'kitchen' },
  { key: 'restrooms',      label: 'Baños',                icon: 'wc' },
  { key: 'accessible',     label: 'Accesibilidad',        icon: 'accessible' },
  { key: 'kids_area',      label: 'Área para niños',      icon: 'child_care' },
  { key: 'projector',      label: 'Pantalla / Proyector', icon: 'tv' },
  { key: 'catering_ready', label: 'Cocina para catering', icon: 'restaurant' },
  { key: 'outdoor',        label: 'Área exterior',        icon: 'park' },
  { key: 'pool',           label: 'Alberca',              icon: 'pool' },
  { key: 'pet_friendly',   label: 'Pet friendly',         icon: 'pets' },
];

const BY_KEY = new Map(AMENITIES.map((a) => [a.key, a]));

export const getAmenity = (key: string): AmenityDef =>
  BY_KEY.get(key) ?? { key, label: key, icon: 'check_circle' };
