import figlet from 'figlet';

const server = Bun.serve({
    port: process.env.PORT || 3000,
    fetch: (req) => {
        const url = new URL(req.url);
        const params = new URLSearchParams(url.search);

        if (url.pathname === '/') {
            const greeting = figlet.textSync('Web - Server');
            return new Response(greeting);
        }

        if (url.pathname === '/users') {
            const userID = params.get('id');
            if (userID) {
                return new Response(`UserID: ${userID}`);
            }
        }

        if (url.pathname === '/error-page') {
            throw new Error('Message of an error')
        }

        return new Response('404 - Page not found', { status: 404 });
    },

    error(error) {
        return new Response(`<pre> ${error.message} \n ${error.stack} </pre>`, {
            headers: {
                'Content-Type': 'text/html',
            }
        });
    },
});

console.log(`Server is running on http://localhost:${server.port}`);
