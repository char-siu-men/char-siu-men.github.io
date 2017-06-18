#!/bin/bash
#
# dockerイメージをローカル(.local_cache)に出力して、キャッシュする。
# キャッシュは、vagrant環境を再構築するときに、docker pull/build の
# 時間を短縮するためのものである。
# vagrant up 時毎に実行されて、dockerイメージの差分をキャッシュに
# 登録するような使い方を想定する。
# 対するキャッシュのロード処理は、 load_docker_cache.sh が処理する。

basedir=$(cd $(dirname $0) && pwd)
. $basedir/../inc/provision_utils.sh

set -e
trap 'echo "ERROR $0" 1>&2' ERR

# .local_cache/docker に docker image の更新分を登録する
docker images --no-trunc | awk 'NR>1 {print}' | while read line
do
  tag=$(echo $line | awk '{print $2}')
  if [ "<none>" = "$tag" ]; then
    continue
  fi
  img=`echo $line | awk '{print $1":"$2}'`
  digest=`echo $line | awk '{print $3}'`
  docker_save_cache $img $digest
done
