/* eslint-disable eqeqeq */
const express = require('express');
const AuthService = require('./auth-service');

const jsonBodyParser = express.json();
const authRouter = express.Router();

authRouter
  .post('/login', jsonBodyParser, (req, res, next) => {
    const { user_name, password } = req.body;
    const loginUser = { user_name, password };

    for (const [key, value] of Object.entries(loginUser)) {
      if (value == null) {
        return res.status(400).json({ error: `Missing '${key}' in request body`});
      }
    }

    AuthService.getUserWithUserName(req.app.get('db'), loginUser.user_name)
      .then( dbUser => {
        if (!dbUser) {
          return res.status(400).json({ error: 'Incorrect user_name or password' });
        }
        AuthService.comparePasswords(loginUser.password, dbUser.password)
          .then( passwordsMatch => {
            if (!passwordsMatch) {
              return res.status(400).json({ error: 'Incorrect user_name or password' });
            }

            res.send('ok');
          });
      });
  });

module.exports = authRouter;