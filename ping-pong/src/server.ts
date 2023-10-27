import uniqid from 'uniqid';
import Game from '../models/Game';
import Ball from '../models/Ball';
import Player from '../models/Player';
import type { Server } from 'bun';

export default (games: Record<string, Game>): Server => {
    const server: Server = Bun.serve<{ sessionId: string, channel: string }>({
        port: process.env.PORT ?? 3577,
    
        fetch(req, server) {
            const sessionId = req.headers.get('cookie')?.split('sessionId=')[1] ?? uniqid();
            const params = new URL(req.url);
            const channel = params.searchParams.get('channel') ?? 'default';
    
            if (server.upgrade(req, {
                    data: {
                        sessionId,
                        channel,
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
                const { channel, sessionId } = ws.data;
                // если новое поле - кидаем на поле мяч
                if (!games[channel]) {
                    games[channel] = new Game(
                        new Ball([ 50, 240 ], 270, 5),
                        [],
                        false,
                        null
                    );
                    // запускаем игровой процесс
                    games[channel].startGameProcess(server, channel);
                    // сообщаем, что ждём второго игрока
                    ws.send(JSON.stringify({ message: 'Waiting 2nd player...' }));
                }
    
                // если ещё нет игроков или только один - добавляем игрока
                // и подписываем его на рассылку
                if (games[channel].getPlayersCount() < 2) {
                    games[channel].addPlayer(new Player(sessionId, 10, 200));
                    ws.subscribe(channel);
    
                    // если подключился второй игрок - запускаем игру
                    if (games[channel].getPlayersCount() === 2) {
                        games[channel].restartGameProcess(server, channel);
                    }
                // если уже есть оба игрока - сообщаем об этом
                } else {
                    ws.send(JSON.stringify({ message: 'The game is in proccess already' }));
                }
            },
            message(ws, message) {
                const { channel, sessionId } = ws.data;
                // ловим нажатие клавиш (вверх/вниз) и двигаем игрока
                if (JSON.parse(message as string).key) {
                    const player = games[channel].getPlayerBySessionId(sessionId);
                    if (!player) {
                        return;
                    }
                    const { key } = JSON.parse(message as string);
                    player.movePlayer(key, games[channel]);
                }
                // отправляем сообщение в канал рассылки
                ws.publish(channel, message);
            },
            close(ws) {
                const { channel, sessionId } = ws.data;
                if (!games[channel]) {
                    return;
                }
                // является ли клиент активным игроком?
                const player = games[channel].getPlayerBySessionId(sessionId);
                
                if (player) {
                    // удаляем игрока из игры
                    games[channel].removePlayerBySessionId(sessionId);
    
                    // если игроков не осталось - удаляем комнату и останавливаем игровой процесс
                    if (games[channel].getPlayersCount() === 0) {
                        games[channel].finishGameProcess();
                        delete games[channel];
                    // иначе сбрасываем игровой процесс и ждём нового игрока
                    } else {
                        games[channel].resetGameProcess();
    
                        server.publish(
                            channel,
                            JSON.stringify({
                                message: 'Waiting 2nd player...',
                                players: games[channel].getAllPlayers(),
                                play: games[channel].isPlay(),
                            })
                        );
                    }
                }
            }
        },
    });

    return server;
};
