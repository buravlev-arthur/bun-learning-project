import { Elysia, t } from "elysia";
import plugin from "./plugins/plugin";
import { userBody, userParams } from './models/user';

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

  // Подключение плагина
  .use(plugin)
  .get('/use-plugin', ({ store }) => `Версия подключенного плагина: ${store['plugin-version']}`);

// Группа и подгруппа маршрутов
app.group('/user', (app) => app
  .group('/signup', (app) => app
    .get('/', () => 'Sign up (GET)')
    .post('/', () => 'Sign up (POST)')
  )
  .get('/logout', () => 'Log out')
  .get('/:id', ({ params: { id }}) => `UserID: ${id}`)
)

// валидация тела запроса
app.post('/user-data', ({ body }) => body, { body: userBody });

// валидация параметров запроса
app.get('/user-data/:id', ({ params: { id } }) => `userID: ${id}`, { params: userParams });

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
