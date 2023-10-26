import startServer from './src/server';

const initApp = () => {
    const server = startServer({});
    console.log(`WebSocket server is running on: ws://localhost:${server.port}`);
};

initApp();
