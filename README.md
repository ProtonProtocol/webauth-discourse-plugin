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

## How does it work?

1. User chooses to login via WebAuth ⚛️
2. User redirected to WebAuth login, and creates a WebAuth session
3. Unique security nonce creation 🔐
    - In the background, the frontend requests a nonce from the backend 
    - The backend creates the nonce, assigns it to the Discourse session, and sends it to the frontend
4. User then signs an additional transaction: Contract `discwebauth`, Action `verify`, with the nonce from step 3 as data
5. Frontend sends the Transaction ID returned from step 4, actor and permission from the WebAuth Session and the nonce to the backend 
6. Backend does a number of checks, and returns with failed authentication if any of the checks don't pass ✅❌
    - Check if the supplied nonce matches the nonce in the Discourse Session
    - Makes sure there's a transaction ID to work with, as well as an actor and permission
    - Calls `get transaction` endpoint on the [Proton Dex API](https://api-docs.protondex.com/) to verify the transaction exists, and get the transaction details of the supplied transaction ID
    - Checks the `account` and `name` of the transaction match `discwebauth` and `verify` respectively
    - Checks the actor and permission of transaction matches the supplied actor and permission
    - Checks the nonce field in the transaction data matches the supplied nonce
    - Checks to make sure the transaction timestamp is no older than 60 seconds
7. Authentication passes 🚀 
    - If the WebAuth account is connected to an existing Discourse account, the user will be logged in to the connected Discourse account
    - If the WebAuth account is not connected, the user will be redirected to setup a new account