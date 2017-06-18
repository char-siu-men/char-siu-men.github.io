#!/bin/bash
#
# プロビジョニングのユーティリティ
# =========================

_inc_dir=$(cd $(dirname $BASH_SOURCE) && pwd)

if [ -e $_inc_dir/../setenv.sh ]; then
  . $_inc_dir/../setenv.sh
fi

# ダウンロードファイルのキャッシュディレクトリ
DOWNLOAD_CACHE_DIR=${DOWNLOAD_CACHE_DIR:-$_inc_dir/../../.local_cache/download}

# docker imageのキャッシュディレクトリ
DOCKER_CACHE_DIR=${DOCKER_CACHE_DIR:-$_inc_dir/../../.local_cache/docker}

WGET=$(builtin command -v wget)
CURL=$(builtin command -v curl)

##
# ファイルをダウンロードする。
# 一度、ダウンロードしたファイルは、ローカルにキャッシュして、再利用する。
# 
# $1 ダウンロードURL
# $2 ダウンロードしたファイルを配置するパス(指定が無いときはstdout)
#
download_cache() {
  url=$1
  dist_path=$2
  cache_entry_name=`echo $url | sed -e 's/[^0-9a-zA-Z~\/\.-]/_/g'`
  cache_entry_name=`echo $cache_entry_name | sed -e 's|//|/|g'`
  cache_entry_name=`echo $cache_entry_name | sed -e 's|/$|/index.html|'`
  cache_path=$DOWNLOAD_CACHE_DIR/$cache_entry_name
  # ここでは、あまり賢いことをしていないので、
  # すでにファイルが存在して、エラーがでるなどの場合、
  # URLのパスを見直して、エラーが出ないようにしてください。
  # 例えば、次のようなURLをキャッシュしようとすると、エラーになるので、
  # URLを固定してください。
  # http://www.yahoo.co.jp
  # http://www.yahoo.co.jp/
  mkdir -p $(dirname $cache_path)
  
  if [ ! -e $cache_path ]; then
    echo "download $url > $cache_path">&2
    $CURL -Ss -L $url > $cache_path
  else
    echo "download $url (cache hit)">&2
  fi
  if [ "" = "$dist_path" ]; then
    cat $cache_path
  else
    cp $cache_path $dist_path
  fi
}

wget() {
  OPT=`getopt -o O:d -l output-document:,debug -- $*`
  output_document=''
  eval set -- $OPT
  while [ -n "$1" ]; do
    case $1 in
      -O|--output-document) output_document=$2; shift 2;;
      --) shift; break;;
      *)
        if [ $2 == -* ]; then
          shift
        fi
        shift;;
    esac
  done
  url=$1
  if [ "" = "$output_document" ]; then
    tmp=`echo $url | sed -e 's|/$|/index.html|'`
    output_document=$(basename $tmp)
  fi
  download_cache $url $output_document
}

curl() {
  OPT=`getopt -o OSsL -l remote-name,show-error,silent,location -- $*`
  remote_name=0
  output_document=''
  eval set -- $OPT
  while [ -n "$1" ]; do
    case $1 in
      -O|--remote-name) remote_name=1; shift;;
      --) shift; break;;
      *)
        if [ $2 == -* ]; then
          shift
        fi
        shift
    esac
  done
  url=$1
  if [ "1" = "$remote_name" ]; then
    output_document=$(basename $url)
  fi
  download_cache $url $output_document
}

docker_cache_env() {
  _docker_image_name=$1
  _docker_cache_path=$DOCKER_CACHE_DIR/$_docker_image_name.tar
  _docker_cache_path=`echo $_docker_cache_path | sed -e "s|:|/|"`
  _docker_cache_dir=`dirname $_docker_cache_path`
}

##
# docker pull してキャッシュする。
# キャッシュは、 pull したイメージを save して、キャッシュディレクトリに保存し、
# 2回目以降の pull では、キャッシュディレクトリから、 load する。
# 
# $1 docker image name
#
docker_pull_cache() {
  docker_cache_env $*
  mkdir -p $_docker_cache_dir

  if [ ! -e $_docker_cache_path ]; then
    echo "docker pull $_docker_image_name"
    docker pull $_docker_image_name
    echo "docker save $_docker_image_name > $_docker_cache_path"
    docker save $_docker_image_name > $_docker_cache_path
  else
    echo "docker load -i $_docker_cache_path"
    docker load -i $_docker_cache_path
  fi
}

docker_compose_build_cache() {
  set -e
  trap 'echo "ERROR $0" 1>&2' ERR

  args="$*"
  do_build=0
  for image_name in $args
  do
    docker_cache_env $image_name
    if [ ! -e $_docker_cache_path ]; then
      do_build=1
      break
    fi
  done

  if [ "1" = "$do_build" ]; then
    docker-compose build
  fi

  for image_name in $args
  do
    if [ "1" = "$do_build" ]; then
      docker_save_cache $image_name
    else
      docker_load_cache $image_name
    fi
  done
}

docker_load_cache() {
  docker_cache_env $*

  if [ -e $_docker_cache_path ]; then
    echo "docker load -i $_docker_cache_path"
    docker load -i $_docker_cache_path
  fi
}

docker_save_cache() {
  docker_cache_env $1
  digest=$2
  digest_curr='no-digest'

  if [ -e ${_docker_cache_path}.sha ]; then
    digest_curr=`cat ${_docker_cache_path}.sha`
  fi
  if [ "$digest" != "$digest_curr" ]; then
    mkdir -p $_docker_cache_dir
    echo "docker save $_docker_image_name > $_docker_cache_path"
    docker save $_docker_image_name > $_docker_cache_path
    echo $digest > ${_docker_cache_path}.sha
  fi
}

##
# URL が有効になるまで(200を返すまで) wait する。
# dockerコンテナで起動されるミドルウェアがアプリを起動するのを、
# 待機するなどの用途を想定する。
# 
# $1 URL
#
wait_url_ready() {
  url=$1
  echo "waiting for $url to be ready"
  while :
  do
    result=`curl -Ss -I --retry 30 --connect-timeout 30 $url | grep "200 OK" | wc -l`
    if [ "$result" = "1" ]; then
      echo "ready!"
      break
    else
      echo "retry ..."
      sleep 3
    fi
  done
  return $result
}

##
# ディストリビューションを調べる。
# 結果は、県境変数(_distrib / _distrib_name / _distrib_ver) に設定される。
# 現在の実装では、次の値が設定されることを確認している。
# それ以外の識別が必要な場合は、実装を追加してください。
# _distrib=centos-6 / _distrib_name=centos / _distrib_ver=6
# _distrib=centos-7 / _distrib_name=centos / _distrib_ver=7
# _distrib=ubuntu-trusty / _distrib_name=ubuntu / _distrib_ver=trusty
# _distrib=ubuntu-xenial / _distrib_name=ubuntu / _distrib_ver=xenial
#
get_distribution_name() {
  if [ -e /etc/redhat-release ]; then
    _distrib_name='centos'
    _distrib_ver=`cat /etc/redhat-release | awk "{print \\$3}" | sed -e 's/\\..*//'`
    if [ "$_distrib_ver" = "release" ]; then
      _distrib_ver=`cat /etc/redhat-release | awk "{print \\$4}" | sed -e 's/\\..*//'`
    fi
  elif [ -e /etc/lsb-release ]; then
    . /etc/lsb-release
    _distrib_name='ubuntu'
    _distrib_ver=$DISTRIB_CODENAME
  else
    echo 'not implemented! [unknown OS]' 1>&2
    exit 1
  fi
  _distrib="${_distrib_name}-${_distrib_ver}"
}
