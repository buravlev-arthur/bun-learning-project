import { Player } from './Player';
import { Game } from './Game';

export class Ball {
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

    moveBall(
        [ leftPlayer, rightPlayer ]: Player[],
        game: Game,
        server: any,
        channel: string
    ): void {
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
                game.resetGameProcess();
                game.restartGameProcess(server, channel);
            } else {
                [ leftPlayer, rightPlayer ]
                    .forEach((player) => player.resetPlayer(200));
                this.setBallData(initBallCoords, 270);
                game.pauseGameProcess();
            }
        }
        // если шар ушёл за правую линию
        else if ( x === this.xLimits.max ) {
            leftPlayer.addPoint();
            if (leftPlayer.isWinner()) {
                game.resetGameProcess();
                game.restartGameProcess(server, channel);
            } else {
                [ leftPlayer, rightPlayer ]
                    .forEach((player) => player.resetPlayer(200));
                this.setBallData(initBallCoords, 90);
                game.pauseGameProcess();
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