import uniqid from 'uniqid';

const server = Bun.serve<{ sessionId: string, room: string }>({
    port: process.env.PORT ?? 8080,

    fetch(req, server) {
        const sessionId = req.headers.get('cookie')?.split('sessionId=')[1] ?? uniqid();
        const params = new URL(req.url);
        const room = params.searchParams.get('room') ?? 'default-room';

        if (server.upgrade(req, {
                data: {
                    sessionId,
                    room,
                },
                headers: {
                    'Set-Cookie': `sessionId=${sessionId}`,
                }
            }
        )) {
            return;
        }
        return new Response('Can\'t upgrade connection', {
            status: 500,
        });
    },

    websocket: {
        open(ws) {
            // если новое поле - кидаем на поле мяч
            if (!games[ws.data.room]) {
                games[ws.data.room] = {
                    players: [],
                    ball: new Ball({ x: 0, y: 240 }, 270, 20),
                    play: true,
                    gameProcess: null
                };
                // запускаем игровой процесс
                startGameProcess(ws.data.room);
            }

            // если ещё нет игроков или только один - добавляем игрока
            // и подписываем его на рассылку
            if (games[ws.data.room].players.length < 2) {
                games[ws.data.room].players.push(new Player(ws.data.sessionId));
                ws.subscribe(ws.data.room);
                ws.publish(
                    ws.data.room,
                    JSON.stringify({ message: `Second player joined to the game` })
                );
            // если уже есть оба игрока - отдаём фронтенду ошибку
            } else {
                ws.send(JSON.stringify({ message: 'This room is filled' }));
            }
        },
        message(ws, message) {
            ws.publish(ws.data.room, message);
        },
        close(ws) {
            if (!games[ws.data.room]) {
                return;
            }
            // является ли клиент активным игроком в комнате?
            const isPlayer = !!(games[ws.data.room].players
                .findIndex((player) => player.getSessionId() === ws.data.sessionId) + 1);
            
            if (isPlayer) {
                // удаляем игрока из игры
                games[ws.data.room].players = games[ws.data.room].players
                    .filter((player) => player.getSessionId() !== ws.data.sessionId);
                server.publish(
                    ws.data.room,
                    JSON.stringify({ message: 'Other player leaved the game' })
                );

                // если игроков не осталось - удаляем комнату и останавливаем игровой процесс
                if (!games[ws.data.room].players.length) {
                    finishGameProcess(ws.data.room);
                    delete games[ws.data.room];
                }
            }
        }
    },
});

console.log(`WebSocket server is running on: ws://localhost:${server.port}`); 

const startGameProcess = (room: string): void => {
    games[room].gameProcess = setInterval(() => {
        const game = games[room];
    
        if (!game.play) {
            return;
        }
    
        game.ball.moveBall();
        server.publish(
            room,
            JSON.stringify({
                ball: game.ball.getCoords(),
                players: game.players,
                play: game.play,
            })
        );
    }, 40);
};

const finishGameProcess = (room: string): void => {
    clearInterval(games[room].gameProcess as NodeJS.Timeout);
}

interface Game {
    players: Player[];
    ball: Ball;
    play: boolean;
    gameProcess: NodeJS.Timeout | null;
}

const games: Record<string, Game> = {};

class Player {
    private sessionId: string = '';
    private racketCoordY: number = 0;
    private score: number = 0;

    constructor(sessionId: string) {
        this.sessionId = sessionId;
    }

    getSessionId() {
        return this.sessionId;
    }

    getPlayerData() {
        return {
            sessionId: this.sessionId,
            racketY: this.racketCoordY,
            score: this.score
        }
    }
}

class Ball {
    private xLimits = { min: 0, max: 790 };
    private yLimits = { min: 0, max: 490 };
    private currentCoords = [ 0, 0 ];
    private radPi = 180;
    private speed = 1;
    private degrees = 0;

    constructor(
        initCoords = { x: 0, y: 0 },
        initDegrees = 0,
        initSpeed = 1
    ) {
        this.currentCoords = [
            initCoords.x,
            initCoords.y
        ];
        this.speed = initSpeed;
        this.degrees = initDegrees;
    }   

    private getCoordsAlpha(): number[] {
        const rad = this.degrees * (Math.PI / 180);
        const sin = Math.sin(Number(rad.toFixed(5)));
        const cos = Math.cos(Number(rad.toFixed(5)));
        return [
            Math.round(sin * this.speed),
            Math.round(cos * this.speed),
        ]
    }

    getCoords(): { x: number, y: number } {
        return {
            x: this.currentCoords[0],
            y: this.currentCoords[1],
        }
    }

    moveBall(): void {
        const [ x, y ] = this.currentCoords;
        const degreesShift = Math.round(Math.random() * 60) - 30;

        // если шар попал в один из углов
        if (x == this.xLimits.min && y == this.yLimits.min) {
            this.degrees = this.radPi / 4 + degreesShift;
        } 
        else if (x == this.xLimits.min && y == this.yLimits.max) {
            this.degrees = this.radPi / 4 * 3 + degreesShift;
        }
        else if (x == this.xLimits.max && y == this.yLimits.max) {
            this.degrees = this.radPi / 4 * 5 + degreesShift;
        }
        else if (x == this.xLimits.max && y == this.yLimits.min) {
            this.degrees = this.radPi / 4 * 7 + degreesShift;
        }
        // если шар попал в левый или правый края
        else if (x == this.xLimits.min || x == this.xLimits.max) {
            this.degrees = this.radPi * 2 - this.degrees + degreesShift;
        }
        // если шар попал в верхний или нижний края
        else if (y == this.yLimits.min || y == this.yLimits.max) {
            this.degrees = this.degrees <= 180
                ? this.radPi - this.degrees + degreesShift
                : this.radPi * 3 - this.degrees + degreesShift;
        }

        const [ alphaX, alphaY ] = this.getCoordsAlpha();
        const [ currentX, currentY ] = this.currentCoords;
        this.currentCoords = [
            Math.min(Math.max(currentX + alphaX, this.xLimits.min), this.xLimits.max),
            Math.min(Math.max(currentY + alphaY, this.yLimits.min), this.yLimits.max)
        ];
    }
}