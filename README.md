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

        // если ни один маршрут не совпадает
        return new Response('404 - Page not found', { status: 404 });
    }
});
```

Обработка ошибок:

```javascript
Bun.server({
    fetch: (req) => {
        const url = new URL(req.url);
        if (url.pathname === '/error-page') {
            // бросаем исключение
            throw new Error('Message of an error');
        }
    },

    // обрабатываем исключение
    error: (err) => {
        return new Response(`<pre>${err}\n${err.stack}</pre>`, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    }
})
```

