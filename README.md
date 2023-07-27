# Log in with WebAuth for Discourse

This is an open source [Discourse](https://github.com/discourse/discourse/) plugin enabling users to log in using [WebAuth](https://webauth.com/).

## Overview
- Users can opt to log in using WebAuth
- Users can also connect existing Discourse accounts to their WebAuth credentials

### Requirements
A Discourse forum that is self-hosted or that is hosted with a provider that allows third party plugins.

### Note
Users will still need to enter an email to associate with their accounts after authenticating for the first time. Once an email address is connected to the account, users can log in via WebAuth at any time.

## Enabling the plugin
To install and enable the plugin on your self-hosted Discourse, first access the `app.yml` file at `/var/discourse/containers/`

```bash
cd /var/discourse
nano containers/app.yml
```

Add the plugin’s repository URL to your container’s app.yml file:
```yml
hooks:
  after_code:
    - exec:
      cd: $home/plugins
      cmd:
        - sudo -E -u discourse git clone https://github.com/discourse/docker_manager.git
        - sudo -E -u discourse git clone https://github.com/conorseed/discourse-webauth.git   # <-- added
```

Follow the existing format of the docker_manager.git line. For example, if it does not contain `sudo -E -u discourse` then insert - `git clone https://github.com/conorseed/discourse-webauth.git`.

Rebuild the container:
```bash
cd /var/discourse
./launcher rebuild app
```

### Disabling the plugin
To disable it either remove the plugin or uncheck `discourse webauth` enabled at `Admin Settings -> Plugins -> discourse-webauth -> discourse webauth enabled`.

![Discourse Plugins](/settings.png "Discourse Plugins")
![Enable plugin at settings](/enable.png "Enable plugin at settings")

### Chain Settings
You have two options for the chain: 
- Proton Mainnet (default)
- Proton Testnet

![WebAuth Chain](/chain.png "WebAuth Chain")