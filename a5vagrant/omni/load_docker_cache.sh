#!/bin/bash
#
# ローカル(.local_cache)にキャッシュされた docker image を、
# vagrant環境を再構築する provision 過程で、ロードする。

_omni_dir=$(cd $(dirname $0) && pwd)
. $_omni_dir/../inc/provision_utils.sh

set -e
trap 'echo "ERROR $0" 1>&2' ERR

# .local_cache/docker から docker image を load する
if [ -e $DOCKER_CACHE_DIR ]; then
  for img in `find $DOCKER_CACHE_DIR -name "*.tar" -type f`
  do
    echo "docker load -i $img"
    docker load -i $img
  done
fi
