import EmberObject from "@ember/object";
import { run } from "@ember/runloop";

// ProtonWebSDK is loaded in the providerInit function
// see: https://docs.protonchain.com/ for more info
const Proton = EmberObject.extend({

  async providerInit({ title, chain }){
    // set vars
    this.chainId = (chain === 'Proton Testnet') ? '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd' : '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0';
    this.endpoints = (chain === 'Proton Testnet')
      ? ['https://tn1.protonnz.com', 'https://test.proton.eosusa.news', 'https://testnet.brotonbp.com']
      : ['https://api.protonnz.com', 'https://proton.eosusa.news', 'https://mainnet.brotonbp.com'];
    this.appName = title;
    this.appLogo = 'https://docs.protonchain.com/images/icon.svg';
    this.requestAccount = 'discwebauth';
    this.session = null;
    this.link = null;
    this.loaded = false;

    // load proton sdk
    try {
      await this.loadScript("/plugins/discourse-webauth/javascripts/@proton/bundle.js");
      this.set('loaded', true);
      return true;
    } catch (e) {
      return e;
    }

  },

  // Custom function to load ProtonSDK
  // based off "discourse/lib/load-script"
  // but rejects the promise if loading fails
  async loadScript(path) {
    return new Promise(function (resolve, reject) {
      const head = document.getElementsByTagName("head")[0];
      let s = document.createElement("script");
      s.src = path;

      // Don't leave it hanging if something goes wrong
      s.onerror = function () {
        run(null, reject);
      };

      s.onload = s.onreadystatechange = function (_, abort) {
        if (
          abort ||
          !s.readyState ||
          s.readyState === "loaded" ||
          s.readyState === "complete"
        ) {
          s = s.onload = s.onreadystatechange = null;
          if (!abort) {
            run(null, resolve);
          }
        }
      };

      head.appendChild(s);
    });
  },

  // login using ProtonWebSDK
  async login () {
    try {
      const { link, session } = await ProtonWebSDK({
        linkOptions: { chainId: this.chainId, endpoints: this.endpoints },
        transportOptions: { requestAccount: this.requestAccount, backButton: true },
        selectorOptions: { appName: this.appName, appLogo: this.appLogo}
      });
      this.link = link;
      this.set('session', session);
    } catch (e){
      return e;
    };
  }
});

export default Proton;