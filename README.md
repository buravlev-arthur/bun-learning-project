# Учебное приложение на Bun

Установка и запуск:

```bash
# установка Bun
npm i -g bun
# создание и переход в директорию проекта
mkdir bun-project && cd bun-project
# генерация и установка нового проекта
bun init
# запуск проекта
bun run index.ts
```

Добавление и запуск скриптов:

```json
// package.json
{
    "scripts": {
        "start": "bun run web-server.ts"
    }
}
```

```bash
# запуск сценария
bun start
```

Запуск в режиме отслеживания (watch mode):

```bash
bun --watch index.ts
```

Установка пакета:

```bash
bun add package-name
```

Простейший сервер:

```javascript
const server = Bun.serve({
    port: 3000,
    fetch: (req) => {
        return new Response('Web-server is working');
    }
});

console.log(`Server is starting on: ${server.port}`);
```

Маршруты:

```javascript
Bun.serve({
    fetch: (req) => {
        const url = new URL(req.url);
        const params = new URLSearchParams(url.search);

        if (url.pathname === '/') {
            return new Response('Main page');
        }

        // маршрут с параметром "id"
        if (url.pathname === '/users') {
            const userID = params.get('id');
            if (userID) {
                return new Response(`UserID: ${userID}`);
            }
        }

        return new Response('404');
    }
});
```
