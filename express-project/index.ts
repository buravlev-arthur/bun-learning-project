import express from 'express';

const app = express();
const port = 8080;

app.get('/', (req, res) => {
    res.send('Express server is working now');
});

app.listen(port, () => {
    console.log(`Express server is listening on: http://localhost:${port}`);
});
