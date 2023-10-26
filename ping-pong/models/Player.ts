import Game from './Game';

export default class Player {
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

    movePlayer(key: string, game: Game): void {
        if (!game.isPlay()) {
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
        return this.score === 11;
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
