#!/bin/bash
#
# Vagrantのプロビジョンスクリプト
# =============================

basedir=$(cd $(dirname $0) && pwd)
a5vagrant=$basedir/a5vagrant
. $a5vagrant/inc/provision_utils.sh

set -e
trap 'echo "ERROR $0" 1>&2' ERR

## 社内ネットワークの設定
$a5vagrant/omni/setup_a5net.sh

### ここからアプリの固有のプロビジョン処理を・・・

echo 'install docker ...'
$a5vagrant/omni/docker.sh
echo 'install docker_compose ...'
$a5vagrant/omni/docker_compose.sh

echo 'load_docker_cache.sh ...'
$a5vagrant/omni/load_docker_cache.sh

#echo 'docker build ...'
# cd /vagrant
# docker-compose build

### ・・・ここまで

## vagrant ssh したときのディレクトリを /vagrant に
cat >> /home/vagrant/.bashrc <<-EOT
cd /vagrant
EOT

echo "SUCCESS - $0"
