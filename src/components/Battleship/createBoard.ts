export type Grid = number[][];

export const placeBoatsOnGridRandomly = (
  width: number,
  height: number,
  boatSizes: number[]
): Grid => {
  // Initialize an empty grid with 0s
  const grid: Grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0)
  );

  // Helper function to check if a boat can be placed at a given position
  const canPlaceBoat = (
    x: number,
    y: number,
    size: number,
    orientation: "horizontal" | "vertical"
  ): boolean => {
    if (orientation === "horizontal" && x + size > width) return false;
    if (orientation === "vertical" && y + size > height) return false;

    for (let i = 0; i < size; i++) {
      const checkX = orientation === "horizontal" ? x + i : x;
      const checkY = orientation === "vertical" ? y + i : y;

      if (grid[checkY][checkX] !== 0) return false;
    }

    return true;
  };

  // Iterate through each boat size and try to place it
  for (let boatId = 1; boatId <= boatSizes.length; boatId++) {
    const size = boatSizes[boatId - 1];
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      // Limit the number of attempts to avoid infinite loops
      attempts++;

      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const orientation: "horizontal" | "vertical" =
        Math.random() < 0.5 ? "horizontal" : "vertical";

      if (canPlaceBoat(x, y, size, orientation)) {
        for (let i = 0; i < size; i++) {
          const placeX = orientation === "horizontal" ? x + i : x;
          const placeY = orientation === "vertical" ? y + i : y;
          grid[placeY][placeX] = boatId;
        }

        placed = true;
      }
    }

    if (attempts === 1000) {
      console.warn(
        `Could not place boat of size ${size} after ${attempts} attempts.`
      );
    }
  }

  return grid;
};
