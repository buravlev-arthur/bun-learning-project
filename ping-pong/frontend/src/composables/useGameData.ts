import { ref, onMounted } from 'vue';

export const useGameData = () => {
    interface Ball {
      x: number;
      y: number;
    }
  
    const socket = ref<WebSocket | null>(null);

    const ball = ref<Ball>({
      x: 0,
      y: 0
    });

    // const sendMessage = () => {
    //     const randomNumber = Math.ceil(Math.random() * 100).toString();
    //     socket.value?.send(randomNumber);
    // };

    function updateBallCoords(data: Ball): void {
      ball.value = data;
    }

    onMounted(() => {
        socket.value = new WebSocket('ws://localhost:8080/');
      
        socket.value.addEventListener('message', (event) => {
          const recivedData = JSON.parse(event.data);
          if (recivedData.ball) {
            updateBallCoords(recivedData.ball as Ball);
          }

          if (recivedData.message) {
            console.log(recivedData.message);
          }
        });

        // document.addEventListener('keydown', (event) => {
        //   socket.value?.send(JSON.stringify({ key: event.code }));
        // });
    });

    return {
        ball,
    };
};
