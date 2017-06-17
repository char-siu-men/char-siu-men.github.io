#!/bin/bash
#
# VagrantでのOS起動時の自動実行スクリプト
# =====================================

basedir=$(cd $(dirname $0) && pwd)
a5vagrant=$basedir/a5vagrant
. $a5vagrant/inc/provision_utils.sh

set -e
trap 'echo "ERROR $0" 1>&2' ERR

## 社内ネットワークの設定
$a5vagrant/omni/setup_a5net.sh

echo 'put_docker_cache.sh ...'
$a5vagrant/omni/put_docker_cache.sh

### ここからアプリ固有のOS起動時の自動実行処理を・・・

# SELinuxを無効に
setenforce 0

# dockerコンテナ起動
cd /vagrant/
docker-compose up -d
sleep 3
docker-compose logs

echo 'Web Starter Kitのコンテナ内へは・・・'
echo '-->  sudo docker exec -it wsk bash'

echo 'browser-sync は、コンテナ内で gulp serve を実行してください'
echo '-->  gulp serve'
echo 'あるいは、これでも・・・'
echo '-->  sudo docker exec -it wsk gulp serve'

echo 'ブラウザからは・・・'
addr=`ip addr show eth1 | grep "inet " | awk -F'[ /]+' '{print $3}'`
echo "-->  http://$addr:3000/"

### ・・・ここまで

echo "SUCCESS - $0"
