import { Elysia, t } from "elysia";
import { html } from "@elysiajs/html";
import { db } from "./db";
import { BaseHtml } from "./components/layout/BaseHtml";

import OpenAI from "openai";
import { Cell, GameBoard } from "./components/Model/GameBoard";

export interface Boat {
  id: number;
  size: number;
}

type BoatList = Record<number, Boat>;

let aiExecutionPlan: { x: number; y: number }[];
let turn = 0;
let board: GameBoard;
let enemyBoard: GameBoard;
const BOARD_SIZE = 4;
const BOATS: BoatList = {
  1: { id: 1, size: 2 },
  2: { id: 2, size: 2 },
  3: { id: 3, size: 3 },
};

const ENEMY_BOATS = [
  { id: 1, size: 2 },
  { id: 2, size: 2 },
  { id: 3, size: 3 },
];

const BoatsSelection = ({
  shipId,
  direction,
}: {
  shipId?: number;
  direction?: string;
}) => (
  <div class="flex">
    <a href="/place-boats/1/horizontal">2</a>
    <a href="/place-boats/2/vertical">2</a>
    <a href="/place-boats/3/horizontal">3</a>
    {shipId && (
      <a
        href={`/place-boats/${shipId}/${
          direction === "horizontal" ? "vertical" : "horizontal"
        }`}
      >
        {direction === "horizontal" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 17.25L12 21m0 0l-3.75-3.75M12 21V3"
            />
          </svg>
        )}
      </a>
    )}
  </div>
);
const app = new Elysia()
  .use(html())
  .get("/place-boats", () => {
    board = new GameBoard(4);

    return (
      <BaseHtml>
        <div class="w-screen flex justify-center flex-col items-center mt-10 text-[40px]">
          <h1>Battleship!</h1>
          <BoatsSelection />
        </div>
      </BaseHtml>
    );
  })
  .get("/battle", async () => {
    enemyBoard = new GameBoard(4);

    enemyBoard.addShipsRandomly(ENEMY_BOATS);

    turn = 0;
    aiExecutionPlan = await aiPlan();

    return (
      <BaseHtml>
        <div class="w-screen flex justify-center flex-col items-center mt-10 text-[40px]">
          <h1>Battle!</h1>
          <div id="battle-board" class="flex space-x-5 text-[40px]">
            <div>{board.renderOwnBoard()}</div>
            <div>{enemyBoard.renderAttackBoatsBoard()}</div>
          </div>
        </div>
      </BaseHtml>
    );
  })
  .post(
    "/attack",
    ({ body }) => {
      enemyBoard.recordHit(body.y, body.x);

      const playerWon = enemyBoard.allBoatsHadBeenFound();

      if (playerWon) {
        return (
          <div>
            <h1>YOU WON</h1>
            <a href="place-boats">Play again</a>
          </div>
        );
      }

      const enemyAttack = aiExecutionPlan[turn];
      board.recordHit(enemyAttack.y, enemyAttack.x);

      const enemyWon = board.allBoatsHadBeenFound();

      if (enemyWon) {
        return (
          <div>
            <h1>COMPUTER WON</h1>
            <a href="place-boats">Play again</a>
          </div>
        );
      }

      turn = turn + 1;

      return (
        <div id="battle-board" class="flex space-x-5 text-[40px]">
          <div>{board.renderOwnBoard()}</div>
          <div>{enemyBoard.renderAttackBoatsBoard()}</div>
        </div>
      );
    },
    {
      body: t.Object({
        x: t.Numeric(),
        y: t.Numeric(),
      }),
    }
  )
  .get(
    "/place-boats/:shipId/:direction",
    ({ params }) => {
      return (
        <BaseHtml>
          <div class="w-screen flex justify-center flex-col items-center mt-10 text-[40px]">
            <h1>Battleship!</h1>
            <BoatsSelection
              shipId={params.shipId}
              direction={params.direction}
            />
            {board.renderPlaceBoatsBoard(params.shipId, params.direction)}
          </div>
          <a href="/battle">start playing</a>
          <div class="htmx-indicator">LOADING!</div>
        </BaseHtml>
      );
    },
    {
      params: t.Object({
        shipId: t.Numeric(),
        direction: t.String(),
      }),
    }
  )
  .post(
    "/place-boats/:shipId/:direction",
    ({ params, body }) => {
      const startColumn = body.x;
      const startRow = body.y;
      let endColumn = body.x;
      let endRow = body.y;

      const boat = BOATS[params.shipId];

      if (params.direction === "horizontal") {
        endColumn = body.x + boat.size - 1;
      } else {
        endRow = body.y + boat.size - 1;
      }

      board.addShip(params.shipId, startRow, startColumn, endRow, endColumn);
      return board.renderPlaceBoatsBoard(params.shipId, params.direction);
    },
    {
      params: t.Object({
        shipId: t.Numeric(),
        direction: t.String(),
      }),
      body: t.Object({
        x: t.Numeric(),
        y: t.Numeric(),
      }),
    }
  )
  .get("/", () => {
    return (
      <BaseHtml>
        <div class="w-screen flex justify-center flex-col items-center mt-10 text-[40px]">
          <h1>Battleship!</h1>
          <a href="/place-boats">Start Playing!</a>
        </div>
      </BaseHtml>
    );
  })

  .get("/styles.css", () => Bun.file("./tailwind-gen/styles.css"))
  .listen(3000);

console.log(
  `Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

const aiPlan = async () => {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
  });

  const content = `I'm making a battleship game. I want you to act as the opponent in my game. I only want to make one request to get your execution plan so I will give you the position of the players boats. 
  You will then send me which positions you want to attack. I want you to be smart and use use the knowledge that you hit a boat to figure out your next attack. 
  Since I only want to send one request to you I will give you the position of the users boats. 
  I want you to play as if you dont know the position and. only use that data to see if you hit or miss. Ok lets start 

  The grid is ${BOARD_SIZE}x${BOARD_SIZE}. ${
    Object.keys(BOATS).length
  } boats, with the sizes ${Object.values(BOATS)
    .map((x) => x.size)
    .join(",")}, which means you need to make ${Object.values(BOATS)
    .map((x) => x.size)
    .reduce(
      (prev, c) => prev + c,
      0
    )} hits to win. I will give you my boats position 
   but you have to pretend that you don't know it. My board looks like this ${JSON.stringify(
     findNumberPositions(board.board)
   )}  where the numbers are my boats 
  
  Give me you exact execution plan in a JSON format that i can turn into a javascript object. Example of the format would be
   [{x:1, y:1}, {x:2, y:1}]
   and so on.
   Only answer with your execution plan and nothing else. Stop when you found all my boats.
  
  I repeat, don't give me explications of what you are doing. Only reply with json data of the execution plan since I want to parse the message in my node program. 
  And stop when you found all my boats. Don't continue to attack then`;

  console.log(content);

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content,
      },
    ],
    stream: false,
  });

  console.log(response.choices[0].message.content);

  const parsed = JSON.parse(response.choices[0].message.content || "");
  return parsed;
};

function findNumberPositions(arr: Cell[][]) {
  const positions = [];

  for (let y = 0; y < arr.length; y++) {
    for (let x = 0; x < arr[y].length; x++) {
      if (typeof arr[y][x] === "number") {
        positions.push({ x: x, y: y });
      }
    }
  }

  return positions;
}
