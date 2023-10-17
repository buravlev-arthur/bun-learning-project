import Elysia from "elysia";

export default new Elysia()
  .state('plugin-version', 1)
  .get('/version', ({ store }) => ({ pluginVersion: store['plugin-version']}))
  .get('/greet', () => 'Hi! I am plugin');