import { Elysia } from "elysia";

let postIds = 0;

const app = new Elysia()
  .get("/", () => "Hello Elysia")

  // Запрос с параметром
  .get("/posts/:id", ({ params: { id } }) => ({ id, title: 'Text' }))

  // POST-запрос
  .post("/posts/add", ({ body, set }) => {
    set.status = 201;
    return { id: postIds++, ...body as Object };
  })

  // любой маршрут после "track/"
  .get('/track/*', () => 'Track route')

  // запрос в стиле чистого Bun
  .get('/all-users', () => {
    return new Response(JSON.stringify({ 
      users: [ 'John', 'Adam', 'Mike' ]
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  })

  // Состояние и декоратор
  .state('version', 1)
  .decorate('getDate', () => new Date().toLocaleDateString())
  .get('/meta', ({ store: { version }, getDate }) => ({
    version,
    date: getDate(),
  }))

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
