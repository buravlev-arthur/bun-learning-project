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
                    ball: new Ball([ 24, 240 ], 270, 20),
                    play: false,
                    gameProcess: null
                };
                // запускаем игровой процесс
                startGameProcess(ws.data.room);
                // сообщаем, что ждём второго игрока
                ws.send(JSON.stringify({ message: 'Waiting 2nd player...' }));
            }

            // если ещё нет игроков или только один - добавляем игрока
            // и подписываем его на рассылку
            if (games[ws.data.room].players.length < 2) {
                games[ws.data.room].players.push(new Player(ws.data.sessionId, 20, 200));
                ws.subscribe(ws.data.room);

                // если подключился второй игрок - запускаем игру
                if (games[ws.data.room].players.length === 2) {
                    restartGameProcess(ws.data.room);
                }
            // если уже есть оба игрока - сообщаем об этом
            } else {
                ws.send(JSON.stringify({ message: 'The game is in proccess already' }));
            }
        },
        message(ws, message) {
            // ловим нажатие клавиш (вверх/вниз) и двигаем игрока
            if (JSON.parse(message as string).key) {
                const player = games[ws.data.room].players
                    .find((player) => player.getSessionId() === ws.data.sessionId);
                if (!player) {
                    return;
                }
                const { key } = JSON.parse(message as string);
                player.movePlayer(key, ws.data.room);
            }

            // отправляем сообщение в канал рассылки
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

                // если игроков не осталось - удаляем комнату и останавливаем игровой процесс
                if (!games[ws.data.room].players.length) {
                    finishGameProcess(ws.data.room);
                    delete games[ws.data.room];
                // иначе сбрасываем игровой процесс и ждём нового игрока
                } else {
                    resetGameProcess(ws.data.room);

                    server.publish(
                        ws.data.room,
                        JSON.stringify({
                            message: 'Waiting 2nd player...',
                            players: [],
                            play: false,
                        })
                    );
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
    
        game.ball.moveBall(game.players, room);
        server.publish(
            room,
            JSON.stringify({
                ball: game.ball.getCoords(),
                players: game.players
                    .map((player) => player.getPlayerData()),
                play: game.play,
            })
        );
    }, 40);
};

const pauseGameProcess = (room: string): void => {
    games[room].play = false;
    setTimeout(() => {
        if (games[room].players.length < 2) {
            return;
        }
        games[room].play = true;
    }, 2000);
}

const resetGameProcess = (room: string): void => {
    games[room].play = false;
    games[room].players.forEach((player) => player.resetPlayer(200, 0, 20));
    games[room].ball.setBallData([ 24, 240 ], 270, 20);
}

const restartGameProcess = (room: string): void => {
    let timer: number = 4;
    games[room].play = false;
    const interval = setInterval(() => {
        if (games[room].players.length < 2) {
            clearInterval(interval);
            return;
        }
        server.publish(room, JSON.stringify({ message: `New game in: ${timer - 1}` }));
        timer -= 1;
        if (timer === 2) {
            pauseGameProcess(room);
        }
        if (!timer) {
            clearInterval(interval);
        }
    }, 1000);
}

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
    private yLimit: Record<string, number> = { min: 0, max: 400 };
    private racketYAlpha: Record<string, number> = {
        'ArrowUp': 1,
        'ArrowDown': -1,
    };
    private sessionId: string = '';
    private racketCoordY: number = 0;
    private score: number = 0;
    private speed: number = 1;

    constructor(
        sessionId: string,
        speed?: number,
        racketCoordY?: number
    ) {
        this.sessionId = sessionId;
        this.speed = speed ?? this.speed;
        this.racketCoordY = racketCoordY ?? this.racketCoordY; 
    }

    movePlayer(key: string, game: string): void {
        if (!games[game].play) {
            return;
        }
        this.racketCoordY = Math.max(
            Math.min(this.racketCoordY + this.racketYAlpha[key] * this.speed, this.yLimit.max),
            this.yLimit.min
        );
    }

    resetPlayer(racketCoordY?: number, score?: number, speed?: number) {
        this.racketCoordY = racketCoordY ?? 0;
        this.score = score ?? this.score;
        this.speed = speed ?? this.speed;
    } 

    addPoint() {
        this.score += 1;
    }

    isWinner(): boolean {
        return this.score === 3;
    }

    getSessionId() {
        return this.sessionId;
    }

    getPlayerCoordsRange() {
        return [
            this.racketCoordY,
            this.racketCoordY + 100, 
        ]
    };

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
    private playersCoords = [ 60, 730 ];

    private currentCoords = [ 0, 0 ];
    private radPi = 180;
    private speed = 1;
    private degrees = 0;

    constructor(
        initCoords = [ 0, 0 ],
        initDegrees = 0,
        initSpeed = 1
    ) {
        this.currentCoords = initCoords;
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

    setBallData(coords: number[], degress: number, speed?: number) {
        this.currentCoords = coords ?? [ 0, 0 ];
        this.degrees = degress ?? 0;
        this.speed = speed ?? this.speed;
    }

    moveBall([ leftPlayer, rightPlayer ]: Player[], game: string): void {
        if (!leftPlayer || !rightPlayer || !game) {
            return;
        }
        const [ x, y ] = this.currentCoords;
        const leftPlayerCoordsRange = leftPlayer.getPlayerCoordsRange();
        const rightPlayerCoordsRange = rightPlayer.getPlayerCoordsRange();
        const playerThird = Math.round((leftPlayerCoordsRange[1] - leftPlayerCoordsRange[0]) / 3);
        const initBallCoords = [
            Math.round(this.xLimits.max /2),
            Math.round(this.yLimits.max / 2)
        ];
        // если шар попал в один из углов
        if (x == this.xLimits.min && y == this.yLimits.min) {
            this.degrees = this.radPi / 4;
        } 
        else if (x == this.xLimits.min && y == this.yLimits.max) {
            this.degrees = this.radPi / 4 * 3;
        }
        else if (x == this.xLimits.max && y == this.yLimits.max) {
            this.degrees = this.radPi / 4 * 5;
        }
        else if (x == this.xLimits.max && y == this.yLimits.min) {
            this.degrees = this.radPi / 4 * 7;
        }
        // если шар попал в верхний или нижний края
        else if (y == this.yLimits.min || y == this.yLimits.max) {
            this.degrees = this.degrees <= 180
                ? this.radPi - this.degrees
                : this.radPi * 3 - this.degrees;
        }
        // если шар попал в левого игрока
        else if (
                (x <= this.playersCoords[0] && x > this.xLimits.min)
                && (y >= leftPlayerCoordsRange[0] && y <= leftPlayerCoordsRange[1])
        ) {
            let shift = 0;
            if (y < (leftPlayerCoordsRange[0] + playerThird)) {
                shift += 45;
            } else if (y > (leftPlayerCoordsRange[1] - playerThird)) {
                shift -= 45;
            }
            const newDegress = this.radPi * 2 - this.degrees + shift;
            this.setBallData(
                [ this.playersCoords[0], this.currentCoords[1] ],
                newDegress
            );
        }
        // если шар попал в правого игрока
        else if (
            (x >= this.playersCoords[1] && x < this.xLimits.max)
            && (y >= rightPlayerCoordsRange[0] && y <= rightPlayerCoordsRange[1])
        ) {
            let shift = 0;
            if (y < (rightPlayerCoordsRange[0] + playerThird)) {
                shift -= 45;
            } else if (y > (rightPlayerCoordsRange[1] - playerThird)) {
                shift += 45;
            }
            const newDegress = this.radPi * 2 - this.degrees + shift;
            this.setBallData(
                [ this.playersCoords[1], this.currentCoords[1] ],
                newDegress
            );
        }
        // если шар ушёл за левую линию
        else if ( x === this.xLimits.min ) {
            rightPlayer.addPoint();
            if (rightPlayer.isWinner()) {
                resetGameProcess(game);
                restartGameProcess(game);
            } else {
                [ leftPlayer, rightPlayer ]
                    .forEach((player) => player.resetPlayer(200));
                this.setBallData(initBallCoords, 270);
                pauseGameProcess(game);
            }
        }
        // если шар ушёл за правую линию
        else if ( x === this.xLimits.max ) {
            leftPlayer.addPoint();
            if (leftPlayer.isWinner()) {
                resetGameProcess(game);
                restartGameProcess(game);
            } else {
                [ leftPlayer, rightPlayer ]
                    .forEach((player) => player.resetPlayer(200));
                this.setBallData(initBallCoords, 90);
                pauseGameProcess(game);
            }
        }

        const [ alphaX, alphaY ] = this.getCoordsAlpha();
        const [ currentX, currentY ] = this.currentCoords;
        this.currentCoords = [
            Math.min(Math.max(currentX + alphaX, this.xLimits.min), this.xLimits.max),
            Math.min(Math.max(currentY + alphaY, this.yLimits.min), this.yLimits.max)
        ];
    }
}