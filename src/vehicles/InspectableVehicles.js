/** References only: no cloning or new workshop render objects. */
export function collectInspectableVehicles(engine) {
  const { world, config } = engine;
  return [
    {
      id: 'veiculo-pratica',
      name: 'Carro didático',
      root: world.vehicle.group,
      vehicle: world.vehicle,
      inspectionModel: config.inspection?.practiceModel,
    },
    ...world.lifts.map((lift, index) => ({
      id: `veiculo-elevador-${lift.number}`,
      name: `Veículo do elevador ${lift.number}`,
      root: lift.vehicle.group,
      vehicle: lift.vehicle,
      inspectionModel: config.reconstruction.lifts[index]?.inspectionModel,
    })),
    ...(world.coveredVehicles || []),
    ...(engine.fleet?.inspectionVehicles || []),
  ];
}
