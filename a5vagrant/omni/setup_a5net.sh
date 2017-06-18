#!/bin/bash
#
# altus5の社内ネットワークを設定する
# ================================

basedir=$(cd $(dirname $0) && pwd)
. $basedir/../inc/provision_utils.sh

get_distribution_name

activate_eth1_centos7() {
  # centos7の場合、eth1に固定IPが割り振られないことがあり、
  # その場合は、network restart が必要.
  # dockerも、再起動が必要なので、 setup_docker_centos7 より先に実行する
  private_ip=`ip -f inet a show eth1`
  if [ "$private_ip" = "" ]; then
    echo 'eth1にIPアドレスがないのでネットワーク再起動します'
    systemctl status docker.service
    if [ "$?" = "0" ]; then
      systemctl stop docker.service
      systemctl restart network.service
      systemctl start docker.service
    else
      systemctl restart network.service
    fi
  fi
}

self_signed_cert_centos7() {
  # altus5.local の独自CAの証明書をインストールする
  from_path=/vagrant/a5vagrant/certs/altus5.local.ca.pem 
  to_path=/usr/share/pki/ca-trust-source/anchors/altus5.local.ca.pem
  if [ "$https_proxy" != "" ]; then
    cp $from_path $to_path
  elif [ -e $to_path ]; then
    rm $to_path
  fi
  update-ca-trust extract
}

setup_docker_centos7() {
  # dockerのプロキシー設定
  systemctl status docker.service
  if [ "$?" = "0" ]; then
    _docker_config=/etc/sysconfig/docker
    cp $_docker_config /tmp/_docker.tmp
    if [ ! -e $_docker_config.proxy ]; then
      cp -p $_docker_config $_docker_config.proxy
      cp -p $_docker_config $_docker_config.no_proxy
      sed -i -e "s|^OPTIONS='|OPTIONS='--registry-mirror=https://proxy.altus5.local:5000 --disable-legacy-registry=true |" $_docker_config.proxy
    fi
    if [ "$http_proxy" != "" ]; then
      cp -p $_docker_config.proxy $_docker_config
    else
      cp -p $_docker_config.no_proxy $_docker_config
    fi
    # Error unmounting device xxx というエラー状態になっていることがあって
    # restartすることで解消されるので、毎回再起動する
    systemctl restart docker.service
  fi
}

if [ "$_distrib_name" = "centos" ]; then
  if [ "$_distrib_ver" = "7" ]; then
    activate_eth1_centos7
    self_signed_cert_centos7
    setup_docker_centos7
  else
    echo "not implemented! [$_distrib]" 1>&2
    exit 1
  fi
else
  echo "not implemented! [$_distrib]" 1>&2
  exit 1
fi
