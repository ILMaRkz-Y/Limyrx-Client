#!/bin/sh
# Runs once on first MongoDB data-volume init (docker-entrypoint-initdb.d).
# Creates the dedicated app user the API authenticates with.
set -e
mongosh --quiet "mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@localhost:27017/admin" --eval "
  const appUser = process.env.MONGO_APP_USER || 'limyrx';
  const appPassword = process.env.MONGO_APP_PASSWORD;
  if (!appPassword) { print('MONGO_APP_PASSWORD not set'); quit(1); }
  try {
    db.getSiblingDB('admin').createUser({
      user: appUser,
      pwd: appPassword,
      roles: [{ role: 'readWrite', db: 'limyrx' }],
    });
    print('app user ' + appUser + ' created');
  } catch (e) {
    print(e.message);
    quit(1);
  }
"
