import { ref, onMounted } from 'vue';
import { Ball, Player, RecivedData } from '../types';

export const useGameData = () => {

    const keys: string[] = [ 'ArrowUp', 'ArrowDown' ];
    const connectionTimeoutMs = 2000;

    const socket = ref<WebSocket | null>(null);
    const keyPressInterval = ref<NodeJS.Timeout | null>(null);
    const message = ref<string | null>(null);

    const ball = ref<Ball>({
      x: 0,
      y: 0
    });

    const players = ref<Player[]>([]);

    const isPlay = ref<RecivedData['play']>(false);

    function updateBallCoords(data: Ball): void {
      ball.value = data;
    }

    function updatePlayersData(data: Player[]): void {
      players.value = data;
    }

    function updateGameStatus(status: RecivedData['play']) {
      isPlay.value = status;
    }

    onMounted(() => {
      const host = document.location.hostname;
      socket.value = new WebSocket(`ws://${host}:3577/`);

      // если за отведенное время соединение не установлено
      setTimeout(() => {
          if (socket.value?.readyState === 3) {
            message.value = 'Server connection error';
          }
        }, connectionTimeoutMs);

      // ловим сообщения от сервера
      socket.value.addEventListener('message', (event) => {
        const recivedData: RecivedData = JSON.parse(event.data);
        const ball = recivedData.ball;
        const players = recivedData.players;
        const serverMessage = recivedData.message;

        // обновляем статус игры (игра/пауза)
        updateGameStatus(recivedData.play);
        // обновляем координаты шара
        if (ball) {
          updateBallCoords(ball);
        }
        // обновляем координаты игроков
        if (players) {
          updatePlayersData(players);
        }
        // выводим сообщения сервера
        if (serverMessage) {
          message.value = serverMessage;
        } else {
          message.value = null;
        }
      });

      // когда игрок зажимает клавиши стрелок вверх/вниз
      document.addEventListener('keydown', (event) => {
        const key = event.code;
        if (keys.includes(key) && keyPressInterval.value === null) {
          keyPressInterval.value = setInterval(() => {
            socket.value?.send(JSON.stringify({ key: event.code }));
          }, 10);
        }
      });

      // когда игрок отпускает клавиши со стралеками
      document.addEventListener('keyup', (event) => {
        const key = event.code;
        if (keys.includes(key) && keyPressInterval.value !== null) {
          clearInterval(keyPressInterval.value);
          keyPressInterval.value = null;
        }
      });
    });

    return {
        ball,
        players,
        isPlay,
        message,
    };
};
