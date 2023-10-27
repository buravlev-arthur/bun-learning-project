import Player from './Player';
import Game from './Game';
import type { Server } from 'bun';

export default class Ball {
    private xLimits: { min: number, max: number } = { min: 0, max: 790 };
    private yLimits: { min: number, max: number } = { min: 0, max: 490 };
    private playersCoords: number[] = [ 50, 740 ];

    private currentCoords: number[] = [ 0, 0 ];
    private radPi: number = 180;
    private speed: number = 1;
    private degrees: number = 0;

    constructor(
        initCoords: Ball['currentCoords'] = [ 0, 0 ],
        initDegrees: Ball['degrees'] = 0,
        initSpeed: Ball['speed'] = 1
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

    private getStickedBallToPlayers(
            ballCoords: number[],
            leftPlayerCoordsRange: number[],
            rightPlayerCoordsRange: number[], 
            ballSize: number
        ): number {
        const [ x, y ] = ballCoords;
        const [ xPlayerLeft, xPlayerRight ] = this.playersCoords;
        const degrees = this.degrees;
        const tolerance = 10;

        if (
            ((x >= (xPlayerLeft - tolerance) && x <= (xPlayerLeft + tolerance)))
            && (degrees > 180 && degrees < 360)
            && (y >= leftPlayerCoordsRange[0] && y <= (leftPlayerCoordsRange[1] - ballSize))
        ) {
            return xPlayerLeft;
        }
        if (
            (x >= (xPlayerRight - tolerance) && x <= (xPlayerRight + tolerance))
            && (degrees > 0 && degrees < 180)
            && (y >= rightPlayerCoordsRange[0] && y <= (rightPlayerCoordsRange[1] - ballSize))
        ) {
            return xPlayerRight;
        }
        return x;
    }

    getCoords(): { x: number, y: number } {
        return {
            x: this.currentCoords[0],
            y: this.currentCoords[1],
        }
    }

    setBallData(
        coords: Ball['currentCoords'],
        degress: Ball['degrees'],
        speed?: Ball['speed']
    ) {
        this.currentCoords = coords ?? [ 0, 0 ];
        this.degrees = degress ?? 0;
        this.speed = speed ?? this.speed;
    }

    changeBallSpeed(player: Player): number {
        return player.isMoving()
        ? this.speed * 1.2
        : Math.max(this.speed / 1.2, 5);
    }

    moveBall(
        game: Game,
        server: Server,
        channel: string
    ): void {
        const [ leftPlayer, rightPlayer ] = game.getAllPlayers();
        const [ x, y ] = this.currentCoords;
        const leftPlayerCoordsRange = leftPlayer.getPlayerCoordsRange();
        const rightPlayerCoordsRange = rightPlayer.getPlayerCoordsRange();
        const playerThird = Math.round((leftPlayerCoordsRange[1] - leftPlayerCoordsRange[0]) / 3);
        const ballSize = 10;
        const initBallCoords = [
            Math.round(this.xLimits.max /2),
            Math.round(this.yLimits.max / 2)
        ];

        if (!leftPlayer || !rightPlayer || !game) {
            return;
        }

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
                (x == this.playersCoords[0])
                && (y >= leftPlayerCoordsRange[0] && y <= (leftPlayerCoordsRange[1] - ballSize))
        ) {
            let shift = 0;
            const randomNumber = 45 + (Math.round(Math.random() * 20) - 10);
            if (y < (leftPlayerCoordsRange[0] + playerThird)) {
                shift += randomNumber;
            } else if (y > (leftPlayerCoordsRange[1] - playerThird)) {
                shift -= randomNumber;
            }
            const newDegress = this.radPi * 2 - this.degrees + shift;
            const newSpeed = this.changeBallSpeed(leftPlayer);
            this.setBallData(
                [ this.playersCoords[0], this.currentCoords[1] ],
                newDegress,
                newSpeed
            );
        }
        // если шар попал в правого игрока
        else if (
            (x >= this.playersCoords[1] && x < this.xLimits.max)
            && (y >= rightPlayerCoordsRange[0] && y <= (rightPlayerCoordsRange[1] - ballSize))
        ) {
            let shift = 0;
            const randomNumber = 45 + (Math.round(Math.random() * 20) - 10);
            if (y < (rightPlayerCoordsRange[0] + playerThird)) {
                shift -= randomNumber;
            } else if (y > (rightPlayerCoordsRange[1] - playerThird)) {
                shift += randomNumber;
            }
            const newDegress = this.radPi * 2 - this.degrees + shift;
            const newSpeed = this.changeBallSpeed(rightPlayer);
            this.setBallData(
                [ this.playersCoords[1], this.currentCoords[1] ],
                newDegress,
                newSpeed,
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
                this.setBallData(initBallCoords, 270, 5);
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
                this.setBallData(initBallCoords, 90, 5);
                game.pauseGameProcess();
            }
        }

        const [ alphaX, alphaY ] = this.getCoordsAlpha();
        const [ currentX, currentY ] = this.currentCoords;
        const xBorderStricted = Math.min(Math.max(currentX + alphaX, this.xLimits.min), this.xLimits.max);
        const yBorderStricted = Math.min(Math.max(currentY + alphaY, this.yLimits.min), this.yLimits.max);
        this.currentCoords = [
            this.getStickedBallToPlayers(
                [ xBorderStricted, yBorderStricted ],
                leftPlayerCoordsRange,
                rightPlayerCoordsRange,
                ballSize
            ),
            yBorderStricted
        ];
    }
}