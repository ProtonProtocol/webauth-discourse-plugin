import Controller from "@ember/controller";
import Proton from "../lib/proton";
import { computed } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import I18n from "I18n";

export default Controller.extend({
  // initialises the controller
  async init() {
    this._super(...arguments);

    // Initialise ProtonSDK
    this.proton = Proton.create();
    let loaded = await this.proton.providerInit({
      title: this.siteSettings.title,
      chain: this.siteSettings.discourse_webauth_chain
    });
    // check if ProtonWebSDK loaded - if not, redirect home
    if(typeof loaded === "error" || loaded === undefined) {
      this.return_home({message: I18n.t("discourse_webauth.message.sdk_not_loaded")});
      return;
    }
    // request login
    this.login();
  },

  // login via webauth
  async login(){
    /*
     * 1. Initiate login request via ProtonSDK
     */
    try {
      this.get_message_wrapper().innerHTML = "";
      // initate login request via ProtonSDK
      await this.proton.login();
      // check if session is valid
      if(!this.proton.session) { this.return_home({message: I18n.t("discourse_webauth.message.login_cancelled")}); return; }
      // Thanks for logging in!
      this.get_message_wrapper().innerHTML = I18n.t("discourse_webauth.message.verify_login");
    } catch (e) {
      this.return_home({ message: I18n.t("discourse_webauth.message.login_cancelled") }); return;
    }

  },

  // verify the webauth session
  async verify(){
    /*
     * 1. Request nonce from backend
     */
    let nonce = null;
    try {
      // request nonce
      const res = await ajax("/webauth/nonce");
      // check if nonce is valid
      if(!res) { this.return_home({message: I18n.t("discourse_webauth.message.fetch_nonce_error")}); return; }
      nonce = res.nonce;
    } catch (e) {
      this.return_home({message: I18n.t("discourse_webauth.message.fetch_nonce_error")}); return;
    }

    /*
     * 2. Setup transaction to verify session
     */
    let transaction_id = null;
    try {
      // create action
      const actions = [{
        account: 'discwebauth',
        name: 'verify',
        authorization: [{
          actor: this.proton.session.auth.actor,
          permission: this.proton.session.auth.permission
        }],
        data: {
            nonce
        }
      }];
      // request transaction
      const result = await this.proton.session.transact(
        { actions },
        { broadcast: true }
      );
      // check if transaction is signed
      transaction_id = result?.payload?.tx;

      // throw error if transaction is not signed
      if(!transaction_id) {
        throw new Error("Transaction not valid");
      }

      // Thanks for verifying!
      this.set("verified", true);
      this.get_message_wrapper().innerHTML = I18n.t("discourse_webauth.message.verification_success", { actor: this.proton.session.auth.actor });

    } catch (e) {
      this.return_home({message: I18n.t("discourse_webauth.message.verification_failed")}); return;
    }

    /*
     * 3. Assign values and submit login form for verification
     */
    document.getElementById("webauth_actor").value = this.proton.session.auth.actor;
    document.getElementById("webauth_permission").value = this.proton.session.auth.permission;
    document.getElementById("webauth_nonce").value = nonce;
    document.getElementById("webauth_transaction_id").value = transaction_id;
    setTimeout(() => {
      document.getElementById("webauth_form").submit();
    }, 500);
  },

  // keep track of verification status
  verified: false,

  // computed property to check if proton session is valid
  showVerify: computed("proton.session", "verified", function () {
    return this.proton && this.proton.session && !this.verified;
  }),

  // get the message wrapper
  get_message_wrapper(){
    return document.getElementById("webauth_message");
  },

  // display message and redirect to home page
  return_home({ message }){
    this.error = true;
    const wrapper = this.get_message_wrapper();
    if(!wrapper){
      setTimeout(() => {
        this.return_home({ message });
      }, 100);
      return;
    }
    wrapper.innerHTML = message || I18n.t("discourse_webauth.message.error");
    setTimeout(() => {
      window.location.replace("/");
    }, 1000);
  },

  // allow frontend to access actions
  actions: {
    verify() {
      this.verify();
    }
  }
});