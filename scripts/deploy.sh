#!/bin/bash
PATH="$(npm bin):$PATH"
source .env

set -xeuo pipefail

rm -vrf dist dist.zip
ncc build src/index.ts --minify

pushd dist
zip -vr ../dist.zip .
popd

aws lambda update-function-code \
  --function-name "$BOT_NAME" \
  --zip-file "fileb://dist.zip"
