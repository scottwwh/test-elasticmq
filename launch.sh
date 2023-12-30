#!/bin/bash

cd web
npm run reset

cd ..
docker compose build web
docker compose up