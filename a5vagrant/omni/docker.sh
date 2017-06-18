#!/bin/bash
# 
# dockerのインストール
# ===================

basedir=$(cd $(dirname $0) && pwd)
. $basedir/../inc/provision_utils.sh

get_distribution_name

if [ "$_distrib_name" = "centos" ]; then
  if [ "$_distrib_ver" = "6" ]; then
    rpm -ivh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
    yum install -y docker-io
    chkconfig docker on
    service docker startrant
  elif [ "$_distrib_ver" = "7" ]; then
    yum install -y docker
    systemctl enable docker
    systemctl start docker
    usermod -aG dockerroot vagrant
  else
    echo "not implemented! [$_distrib]" 1>&2
    exit 1
  fi
elif [ "$_distrib_name" = "ubuntu" ]; then
  # Install Docker
  if [ "$_distrib_ver" = "trusty" ]; then
    # Recommended extra packages for Trusty
    apt-get install -y --no-install-recommends \
      linux-image-extra-$(uname -r) \
      linux-image-extra-virtual
  fi
  if [ "$_distrib_ver" = "trusty" -o "$_distrib_ver" = "xenial" ]; then
    apt-get install -y --no-install-recommends \
      apt-transport-https \
      ca-certificates \
      curl \
      software-properties-common
    curl -fsSL https://apt.dockerproject.org/gpg | sudo apt-key add -
    apt-key fingerprint 58118E89F3A912897C070ADBF76221572C52609D
    add-apt-repository \
       "deb https://apt.dockerproject.org/repo/ \
       ubuntu-$(lsb_release -cs) \
       main"
    apt-get update
    apt-get -y install docker-engine=1.13.1-0~ubuntu-$(lsb_release -cs)
  else
    echo "not implemented! [$_distrib]" 1>&2
    exit 1
  fi
  # Manage Docker as a non-root user
  # Configure Docker to start on boot
  if [ "$_distrib_ver" = "xenial" ]; then
    # systemd
    systemctl enable docker
    systemctl start docker
  else
    # upstart
    echo manual | tee /etc/init/docker.override
    chkconfig docker on
  fi
else
  echo "not implemented! [$_distrib]" 1>&2
  exit 1
fi
