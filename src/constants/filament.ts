export const FILAMENT_COLORS = [
  { label: 'White', value: 'white', hex: 'FFFFFF' },
  { label: 'Yellow', value: 'yellow', hex: 'FFF144' },
  { label: 'Grass Green', value: 'grass_green', hex: 'DCF478' },
  { label: 'Bambu Green', value: 'bambu_green', hex: '0ACC38' },
  { label: 'Missletoe Green', value: 'missletoe_green', hex: '057748' },
  { label: 'Dark Blue', value: 'dark_blue', hex: '0D6284' },
  { label: 'Glow Green', value: 'glow_green', hex: '0EE2A0' },
  { label: 'Ice Blue', value: 'ice_blue', hex: '76D9F4' },
  { label: 'Cyan', value: 'cyan', hex: '46A8F9' },
  { label: 'Blue', value: 'blue', hex: '2850E0' },
  { label: 'Iris Purple', value: 'iris_purple', hex: '443089' },
  { label: 'Purple', value: 'purple', hex: 'A03CF7' },
  { label: 'Magenta', value: 'magenta', hex: 'F330F9' },
  { label: 'Sakura Pink', value: 'sakura_pink', hex: 'D4B1DD' },
  { label: 'Pink', value: 'pink', hex: 'F95D73' },
  { label: 'Red', value: 'red', hex: 'F72323' },
  { label: 'Dark Brown', value: 'dark_brown', hex: '7C4B00' },
  { label: 'Orange', value: 'orange', hex: 'F98C36' },
  { label: 'Beige', value: 'beige', hex: 'FCECD6' },
  { label: 'Desert Tan', value: 'desert_tan', hex: 'D3C5A3' },
  { label: 'Brown', value: 'brown', hex: 'AF7933' },
  { label: 'Ash Grey', value: 'ash_grey', hex: '898989' },
  { label: 'Grey', value: 'grey', hex: 'BCBCBC' },
  { label: 'Black', value: 'black', hex: '161616' },
] as const;

export const FILAMENT_TYPES = [
  { label: 'PLA', value: 'pla' },
  { label: 'PETG', value: 'petg' },
  { label: 'ABS', value: 'abs' },
  { label: 'TPU', value: 'tpu' },
  { label: 'Nylon', value: 'nylon' },
] as const;

export const FILAMENT_DEFAULTS: { [key: string]: { minTemp: number; maxTemp: number } } = {
  pla: { minTemp: 190, maxTemp: 240 },
  petg: { minTemp: 220, maxTemp: 270 },
  abs: { minTemp: 240, maxTemp: 280 },
  gpu: { minTemp: 200, maxTemp: 250 },
  tpu: { minTemp: 200, maxTemp: 250 },
  nylon: { minTemp: 190, maxTemp: 240 },
};

// Generate temperature options from 180°C to 280°C in 5°C increments
export const TEMPERATURE_OPTIONS = Array.from({ length: 21 }, (_, i) => ({
  label: `${180 + i * 5}°C`,
  value: (180 + i * 5).toString(),
}));
