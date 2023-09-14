import { Elysia, t } from "elysia";
import { html } from "@elysiajs/html";
import { db } from "./db";
import { todos } from "./db/schema";
import { eq } from "drizzle-orm";
import { BaseHtml } from "./components/layout/BaseHtml";
import { TodoItem } from "./components/Todo/TodoItem";
import { TodoList } from "./components/Todo/TodoList";
import { Board } from "./components/Battleship/Board";
import {
  Grid,
  placeBoatsOnGridRandomly,
} from "./components/Battleship/createBoard";

let enemyGrid: Grid;
const HEIGHT = 7;
const WIDTH = 7;

const app = new Elysia()
  .use(html())
  .get("/", () => {
    enemyGrid = placeBoatsOnGridRandomly(WIDTH, HEIGHT, [2, 4, 4, 5]);

    return (
      <BaseHtml>
        <div class="w-screen flex justify-center flex-col items-center mt-10 text-[40px]">
          <h1>Battleship!</h1>
          <Board height={HEIGHT} width={WIDTH}></Board>
        </div>
      </BaseHtml>
    );
  })
  .get("/todos", async () => {
    try {
      const data = await db.select().from(todos).all();
      console.log(data);
      return <TodoList todos={data} />;
    } catch (error) {
      console.log(error);
    }
  })
  .post(
    "/todos/toggle/:id",
    async ({ params }) => {
      const oldTodo = await db
        .select()
        .from(todos)
        .where(eq(todos.id, params.id))
        .get();
      const newTodo = await db
        .update(todos)
        .set({ completed: !oldTodo.completed })
        .where(eq(todos.id, params.id))
        .returning()
        .get();
      return <TodoItem {...newTodo} />;
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .delete(
    "/todos/:id",
    async ({ params }) => {
      await db.delete(todos).where(eq(todos.id, params.id)).run();
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .post(
    "/attack",
    ({ body }) => {
      console.log(body, enemyGrid);

      const targetHit = enemyGrid[body.y][body.x];

      if (targetHit > 0) {
        return (
          <div class="flex items-center justify-center w-[20px] h-[20px]">
            {targetHit}
          </div>
        );
      }
      return (
        <div class="flex items-center justify-center w-[20px] h-[20px]">❌</div>
      );
    },
    {
      body: t.Object({
        x: t.Numeric(),
        y: t.Numeric(),
      }),
    }
  )
  .post(
    "/todos",
    async ({ body }) => {
      const newTodo = await db.insert(todos).values(body).returning().get();
      return <TodoItem {...newTodo} />;
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1 }),
      }),
    }
  )
  .get("/styles.css", () => Bun.file("./tailwind-gen/styles.css"))
  .listen(3000);

console.log(
  `Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
