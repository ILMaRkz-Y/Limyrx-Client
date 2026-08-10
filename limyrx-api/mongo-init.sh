#!/bin/sh
# Runs once on first MongoDB data-volume init (docker-entrypoint-initdb.d).
# The temp mongod has auth disabled during init, so this connects without
# credentials and provisions the dedicated app user the API authenticates with.
set -e

mongosh --quiet "mongodb://127.0.0.1:27017/admin" --eval "
  const appUser = process.env.MONGO_APP_USER || 'limyrx_app';
  const appPassword = process.env.MONGO_APP_PASSWORD;
  if (!appPassword) { print('MONGO_APP_PASSWORD not set'); quit(1); }
  const db = db.getSiblingDB('admin');
  const existing = db.getUser(appUser);
  if (existing) {
    db.updateUser(appUser, {
      pwd: appPassword,
      roles: [{ role: 'readWrite', db: 'limyrx' }],
    });
    print('updated app user ' + appUser);
  } else {
    db.createUser({
      user: appUser,
      pwd: appPassword,
      roles: [{ role: 'readWrite', db: 'limyrx' }],
    });
    print('created app user ' + appUser);
  }
  print('app user ready');
"
