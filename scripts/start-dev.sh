#!/bin/bash

# This script is a placeholder for a more complex startup script.
# For now, it just runs docker-compose.

set -e

cp -n .env.example .env

docker-compose up --build
