import Ball from './Ball';
import Player from './Player';
import type { Server } from 'bun';

export default class Game {
    private players: Player[] = [];
    private ball: Ball;
    private play: boolean = false;
    private gameProcess: NodeJS.Timeout | null = null; 

    constructor(
        ball: Ball,
        players?: Player[],
        play?: boolean,
        gameProccess?: NodeJS.Timeout | null,
    ) {
        this.ball = ball;
        this.players = players ?? this.players;
        this.play = play ?? this.play;
        this.gameProcess = gameProccess ?? this.gameProcess;
    }

    isPlay(): Game['play'] {
        return this.play;
    }

    getPlayersCount(): number {
        return this.players.length;
    }

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    removePlayerBySessionId(sessionId: string): void {
        this.players = this.players
            .filter((player) => player.getSessionId() !== sessionId);
    }

    getPlayerBySessionId(sessionId: Player['sessionId']): Player | undefined  {
        return this.players.find((player) => player.getSessionId() === sessionId);
    }

    getAllPlayers(): Player[] {
        return this.players;
    }

    startGameProcess = (server: Server, channel: string): void => {
        this.gameProcess = setInterval(() => {
            if (!this.play) {
                return;
            }
        
            this.ball.moveBall(this.players, this, server, channel);
            server.publish(
                channel,
                JSON.stringify({
                    ball: this.ball.getCoords(),
                    players: this.players
                        .map((player) => player.getPlayerData()),
                    play: this.play,
                })
            );
        }, 40);
    };

    pauseGameProcess(): void {
        this.play = false;
        setTimeout(() => {
            if (this.getPlayersCount() < 2) {
                return;
            }
            this.play = true;
        }, 2000);
    }

    resetGameProcess(): void {
        this.play = false;
        this.players.forEach((player) => player.resetPlayer(200, 0, 20));
        this.ball.setBallData([ 24, 240 ], 270, 20);
    }

    restartGameProcess(server: Server, channel: string): void {
        let timer: number = 4;
        this.play = false;
        const interval = setInterval(() => {
            if (this.getPlayersCount() < 2) {
                clearInterval(interval);
                return;
            }
            server.publish(
                channel,
                JSON.stringify({ message: `New game in: ${timer - 1}` })
            );
            timer -= 1;
            if (timer === 2) {
                this.pauseGameProcess();
            }
            if (!timer) {
                clearInterval(interval);
            }
        }, 1000);
    }

    finishGameProcess(): void {
        clearInterval(this.gameProcess as NodeJS.Timeout);
        this.gameProcess = null;
    }
}