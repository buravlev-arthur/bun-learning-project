export interface Ball {
    x: number;
    y: number;
}

export interface Player {
    sessionId: string;
    racketY: number;
    score: number;
}

export interface RecivedData {
    ball?: Ball;
    players?: Player[];
    play?: boolean;
    message?: string;
}
