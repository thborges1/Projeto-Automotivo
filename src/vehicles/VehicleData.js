// Visual model dimensions, not manufacturer service specifications.
export const VEHICLES = {
  corolla: { name: 'Toyota Corolla Híbrido', width: 1.8, length: 4.65 },
  hb20: { name: 'Hyundai HB20', width: 1.72, length: 4.02 },
  gol: { name: 'Volkswagen Gol', width: 1.66, length: 3.9 },
};

export function validateVehiclePlacement({ model, position, rotation, distances }) {
  if (!Object.hasOwn(VEHICLES, model)) throw new Error(`Veículo desconhecido: ${model}`);
  if (
    !Array.isArray(position) ||
    position.length !== 3 ||
    !position.every(Number.isFinite) ||
    !Number.isFinite(rotation)
  ) {
    throw new Error(`Posição/rotação inválida para o veículo: ${model}`);
  }
  if (
    !Array.isArray(distances) ||
    distances.length !== 3 ||
    !distances.every(Number.isFinite) ||
    distances[0] !== 0 ||
    distances[1] <= 0 ||
    distances[2] <= distances[1]
  ) {
    throw new Error('LOD requer distâncias crescentes [0, perto, longe].');
  }
  return VEHICLES[model];
}
