# encoding: utf-8

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  Encoding.default_external = 'UTF-8'

  config.vm.box = "centos/7"

  # VMのホスト名を設定したい場合
  config.vm.hostname = "altus5hp.local"
  # VMのIPアドレスを設定したい場合
  config.vm.network :private_network, ip: "192.168.66.10"

  # ssh-agentでホストOSのsshキーを共有
  config.ssh.forward_agent = true

  # 共有フォルダのパーミッション
  config.vm.synced_folder ".", "/vagrant", type: "virtualbox"

  config.vm.provider :virtualbox do |vb|
    vb.customize ["modifyvm", :id, "--memory", 1024]
  end

  if ENV['http_proxy'] then
    if !Vagrant.has_plugin?("vagrant-proxyconf") then
      STDERR.puts "vagrant-proxyconf プラグインをインストールしてください"
      exit 1
    end
    config.proxy.http     = ENV['http_proxy']
    config.proxy.https    = ENV['https_proxy']
    config.proxy.no_proxy = ENV['no_proxy']
  else
    if Vagrant.has_plugin?("vagrant-proxyconf") then
      config.proxy.enabled = false
    end
  end

  # 初回のみ実行
  config.vm.provision "shell", 
    inline: "/vagrant/provision.sh"
  # 毎起動時実行
  config.vm.provision "shell", run: "always", 
    inline: "/vagrant/provision_always.sh"

end
