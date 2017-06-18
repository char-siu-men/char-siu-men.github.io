#!/bin/bash
#
# docker-compose のインストール
# =============================
#
# 指定できるオプションは、次のとおり。
#
# -v バージョン(デフォルト=1.10.1)
#
# CoreOSでは/usr以下は読み込み専用ということで、/opt/binにインストールする
#

basedir=$(cd $(dirname $0) && pwd)
. $basedir/../inc/provision_utils.sh

install_dir=/usr/bin
version=1.10.1

usage_exit() {
  echo "Usage: $0 [-d version] " 1>&2
  exit 1
}

while getopts v: OPT
do
  case $OPT in
  d)  version==$OPTARG
      ;;
  \?) usage_exit
      ;;
  esac
done

if [ ! -w $install_dir ]; then
  install_dir=/opt/bin
  mkdir -p $install_dir
fi

if [ ! -e $install_dir/docker-compose ]; then
  echo 'setup docker-compose ...'
  
  url=https://github.com/docker/compose/releases/download/$version/docker-compose-`uname -s`-`uname -m`
  curl -sS -L $url > $install_dir/docker-compose 
  chmod +x $install_dir/docker-compose
  $install_dir/docker-compose -v
fi

