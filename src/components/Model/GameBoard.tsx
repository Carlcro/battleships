import { Boat } from "../..";

export type Cell = "empty" | "hit" | "missed" | number;

export class GameBoard {
  board: Cell[][];
  size: number;

  constructor(size: number = 10) {
    this.size = size;
    // Initialize the board with 'empty' cells
    this.board = Array.from(
      { length: this.size },
      () => Array(this.size).fill("empty") as Cell[]
    );
  }

  addShipsRandomly(boats: Boat[]): void {
    for (const boat of boats) {
      let placed = false;
      while (!placed) {
        const orientation = Math.random() < 0.5 ? "horizontal" : "vertical";
        let startRow = Math.floor(Math.random() * this.size);
        let startCol = Math.floor(Math.random() * this.size);
        let endRow =
          orientation === "horizontal" ? startRow : startRow + boat.size - 1;
        let endCol =
          orientation === "vertical" ? startCol : startCol + boat.size - 1;

        if (this.addShip(boat.id, startRow, startCol, endRow, endCol)) {
          placed = true;
        }
      }
    }
  }

  // Add a ship to the board
  addShip(
    shipId: number,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): boolean {
    // Validate the ship placement
    if (
      startRow < 0 ||
      startRow >= this.size ||
      startCol < 0 ||
      startCol >= this.size ||
      endRow < 0 ||
      endRow >= this.size ||
      endCol < 0 ||
      endCol >= this.size ||
      (startRow !== endRow && startCol !== endCol)
    ) {
      return false;
    }

    // Check for any existing ships in the placement area
    for (
      let row = Math.min(startRow, endRow);
      row <= Math.max(startRow, endRow);
      row++
    ) {
      for (
        let col = Math.min(startCol, endCol);
        col <= Math.max(startCol, endCol);
        col++
      ) {
        if (
          typeof this.board[row][col] === "number" &&
          this.board[row][col] != shipId
        ) {
          return false;
        }
      }
    }

    // Remove ship
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === shipId) {
          this.board[i][j] = "empty";
        }
      }
    }

    // Place the ship
    for (
      let row = Math.min(startRow, endRow);
      row <= Math.max(startRow, endRow);
      row++
    ) {
      for (
        let col = Math.min(startCol, endCol);
        col <= Math.max(startCol, endCol);
        col++
      ) {
        this.board[row][col] = shipId;
      }
    }
    return true;
  }

  // Record a hit on the board
  recordHit(row: number, col: number): boolean {
    if (typeof this.board[row][col] === "number") {
      this.board[row][col] = "hit";
      return true;
    }

    this.board[row][col] = "missed";
    return false;
  }

  allBoatsHadBeenFound(): boolean {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (typeof this.board[i][j] === "number") {
          return false;
        }
      }
    }

    return true;
  }

  renderAttackBoatsBoard(): JSX.Element {
    const rows = [];

    for (let i = 0; i < this.size; i++) {
      const cols = [];
      for (let j = 0; j < this.size; j++) {
        cols.push(
          <div
            hx-vals={`{"x":${j},"y":${i}}`}
            hx-post={`/attack`}
            hx-target="#battle-board"
            className={`border border-black box-border w-full h-full`}
            key={`${i}-${j}`}
          >
            {this.cellContent(this.board[i][j])}
          </div>
        );
      }
      rows.push(
        <div class="flex" key={i}>
          {cols}
        </div>
      );
    }

    return (
      <div id="attack-boats-container" class="flex flex-col">
        {rows}
      </div>
    );
  }

  renderOwnBoard(): JSX.Element {
    const rows = [];

    for (let i = 0; i < this.size; i++) {
      const cols = [];
      for (let j = 0; j < this.size; j++) {
        cols.push(
          <div
            className={`${this.cellColor(
              this.board[i][j]
            )} border border-black box-border w-full h-full`}
            key={`${i}-${j}`}
          >
            {this.cellContent(this.board[i][j])}
          </div>
        );
      }
      rows.push(
        <div class="flex" key={i}>
          {cols}
        </div>
      );
    }

    return <div class="flex flex-col">{rows}</div>;
  }

  renderPlaceBoatsBoard(shipId: number, direction: string): JSX.Element {
    const rows = [];

    for (let i = 0; i < this.size; i++) {
      const cols = [];
      for (let j = 0; j < this.size; j++) {
        cols.push(
          <div
            hx-vals={`{"x":${j},"y":${i}}`}
            hx-post={`/place-boats/${shipId}/${direction}`}
            hx-target="#place-boats-container"
            className={`${this.cellColor(
              this.board[i][j]
            )} border border-black box-border w-full h-full`}
            key={`${i}-${j}`}
          >
            🔵
          </div>
        );
      }
      rows.push(
        <div class="flex" key={i}>
          {cols}
        </div>
      );
    }

    return (
      <div id="place-boats-container" class="flex flex-col">
        {rows}
      </div>
    );
  }

  private cellColor(cell: Cell): string {
    if (cell === "empty") {
      return "bg-white";
    }
    if (typeof cell === "number") {
      return "bg-gray-500";
    }

    if (cell === "hit") {
      return "bg-red-500";
    }

    return "bg-white";
  }

  private cellContent(cell: Cell): string {
    if (cell === "hit") {
      return "🔥";
    }

    if (cell === "missed") {
      return "❌";
    }

    return "🔵";
  }

  // Serialize the board to JSON for database storage
  serialize(): string {
    return JSON.stringify(this.board);
  }

  // Deserialize a board from JSON
  static deserialize(json: string): GameBoard {
    const board = JSON.parse(json);
    const gameBoard = new GameBoard();
    gameBoard.board = board;
    return gameBoard;
  }
}
