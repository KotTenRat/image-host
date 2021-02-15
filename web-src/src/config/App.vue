<template>
  <div class="flex flex-col items-center m-dyn">
    <p class="text-3xl mb-16">Go back to <a href="/" class="link" title="Go back home">the home page</a>.</p>

    <p class="my-4 input-holder">
      <input type="text" v-model="apiKey" placeholder="API Key" :class="apiKey ? '' : 'bad'"
             @keydown.space.prevent="" class="input w-full">
    </p>
    <p v-if="apiKey && allDomainsNotClicked" class="my-4 input-holder">
      <input type="button" @click="allDomainsClick" value="Use All Domains" class="button">
    </p>
    <p v-if="apiKey" v-for="(domain, index) of domains" class="fill my-4 input-holder">
      <input ref="domains" type="text" v-model="domain.value" placeholder="Domain"
             @keydown.enter.passive="domainKeypress" :class="domain.value ? 'fill-priority' : 'bad fill-priority'"
             @keydown.space.prevent="" class="input">
      <input type="button" value="Add" @click="addDomainClick" class="button">
      <input v-if="!domain.required" type="button" value="Remove" @click="removeDomainClick" :data-index="index" class="button">
    </p>
    <p v-if="domains[0].value && apiKey" class="my-4 input-holder">
      <label class="label">
        <input type="checkbox" v-model="encryption" style="margin-top: 3vh;" class="checkbox">Encryption
      </label>
    </p>
    <p v-if="encryption" class="my-4 input-holder">
      <input type="text" v-model="encKey" placeholder="Key / Key Length" @keydown="keyLengthKeypress"
             @keydown.space.prevent="" class="input">
    </p>
    <p v-if="domains[0].value && apiKey" class="my-4 input-holder">
      <label class="label">
        <input type="checkbox" v-model="embed" style="margin-top: 3vh;" class="checkbox">Embed
      </label>
    </p>
    <p v-if="embed" class="my-4 input-holder">
      <label class="label">
        <input type="color" v-model="embedColor">Embed Color
      </label>
    </p>
    <p v-if="embed" class="my-4 input-holder">
      <input type="text" placeholder="Embed Text" v-model="embedText" @keydown="embedTextKeydown" class="input">
    </p>
    <p v-if="embed" class="my-4 input-holder">
      <input type="text" placeholder="Timezone" v-model="embedTimezone" @keydown="embedTimezoneKeydown" class="input">
    </p>
    <p v-if="embed" class="my-4 input-holder">
      <label class="label">
        <input type="checkbox" v-model="embedMDY" style="margin-top: 3vh;" class="checkbox">M/D/Y Format
      </label>
    </p>
    <p v-if="domains[0].value && enableExpire && apiKey" class="my-4 input-holder">
      <label class="label">
        <input type="checkbox" v-model="expire" style="margin-top: 3vh;" class="checkbox">Expire
      </label>
    </p>
    <p v-if="expire" class="my-4 input-holder">
      <input type="text" v-model="expireUses" placeholder="Uses before expire" :class="(!expireAfter && !expireUses) ? 'bad' : ''" @keydown="expireUsesKeydown" class="input">
    </p>
    <p v-if="expire" class="my-4 input-holder">
      <input type="text" v-model="expireAfter" placeholder="MS before expire" :class="(!expireAfter && !expireUses) ? 'bad' : ''" @keydown="expireAfterKeydown" class="input">
    </p>
    <p v-if="domains[0].value && apiKey" class="my-4 input-holder">
      <label class="label">
        <input type="checkbox" v-model="showLink" style="margin-top: 3vh;" class="checkbox">Show Link on Discord
      </label>
    </p>
    <p v-if="showLink" class="my-4 input-holder">
      <label class="label">
        <input type="checkbox" v-model="compatSLoD" style="margin-top: 3vh;" class="checkbox">Compatibility SLoD
      </label>
    </p>
    <p v-if="domains[0].value && apiKey" class="my-4 input-holder">
      <input type="text" v-model="nameLength" @keydown="nameLengthKeypress" placeholder="Name Length" :class="nameLengthBad ? 'bad' : ''"
             @keydown.space.prevent="" class="input">
    </p>
    <highlight-code lang="json" class="w-full">
      {{json}}
    </highlight-code>
    <p class="input-holder my-4">
      <input type="button" @click="downloadClick" class="button" value="Download">
    </p>
  </div>
</template>

<script>
const config = require("./config");

function download(data, name) {
  const url = URL.createObjectURL(new Blob([data], {type: "this/is-not-a-valid-mime-type"}));
  let a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

module.exports = {
  name: "App",
  data: () => ({
    apiKey: "",
    domains: [{
      value: location.hostname,
      required: true
    }],
    encryption: null,
    encKey: "",
    nameLength: "",
    pendingDomainUpdate: false,
    nameLengthBad: false,
    embed: false,
    embedColor: "#000000",
    embedText: "",
    embedMDY: false,
    expire: false,
    expireUses: "",
    expireAfter: "",
    showLink: false,
    compatSLoD: false,
    embedTimezone: "",
    allDomainsNotClicked: true,
    enableExpire: config.enableExpire
  }),
  methods: {
    addDomain() {
      this.domains.push({
        value: "",
        required: false
      });
      this.pendingDomainUpdate = true;
    },
    domainKeypress(e) {
      if (e.currentTarget.value) {
        this.addDomain();
      }
    },
    nameLengthKeypress(e) {
      if (this.preventLetter(e)) return;
      const newStr = e.key === "Backspace" ? e.currentTarget.value.slice(0, -1) : e.currentTarget.value + e.key;
      if (newStr) {
        const newNum = +newStr;
        if (newNum > 24) return e.preventDefault();
        this.nameLengthBad = newNum < 6;
      } else this.nameLengthBad = false;
    },
    keyLengthKeypress(e) {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const newStr = e.key === "Backspace" ? e.currentTarget.value.slice(0, -1) : e.currentTarget.value + e.key;
      if (newStr) {
        const newNum = +newStr;
        if (newNum > 1024) e.preventDefault();
      }
    },
    preventLetter(e, extra = "") {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) return true;
      if (!["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Backspace", ...extra].includes(e.key)) {
        e.preventDefault();
        return true;
      }
      return false;
    },
    expireUsesKeydown(e) {
      if (this.preventLetter(e)) return;
      const newStr = e.key === "Backspace" ? e.currentTarget.value.slice(0, -1) : e.currentTarget.value + e.key;
      if (newStr) {
        const newNum = +newStr;
        if (newNum > 10) return e.preventDefault();
      }
    },
    expireAfterKeydown(e) {
      if (this.preventLetter(e)) return;
      const newStr = e.key === "Backspace" ? e.currentTarget.value.slice(0, -1) : e.currentTarget.value + e.key;
      if (newStr) {
        const newNum = +newStr;
        if (newNum > (1000 * 60 * 60 * 24)) return e.preventDefault();
      }
    },
    embedTextKeydown(e) {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const newStr = e.key === "Backspace" ? e.currentTarget.value.slice(0, -1) : e.currentTarget.value + e.key;
      if (newStr.length > 512) return e.preventDefault();
    },
    embedTimezoneKeydown(e) {
      if (this.preventLetter(e, "-")) return;
      const newStr = e.key === "Backspace" ? e.currentTarget.value.slice(0, -1) : e.currentTarget.value + e.key;
      if (newStr && newStr !== "-") {
        const newNum = parseInt(newStr);
        if (!Number.isInteger(newNum) || newNum > 23 || newNum < -23) return e.preventDefault();
      }
    },
    allDomainsClick() {
      this.allDomainsNotClicked = false;
      fetch("/api/domains").then(r => r.json()).then(j => {
        let domainsMapped = j.map(d => ({
          required: false,
          value: d
        }));
        if (domainsMapped[0]) domainsMapped[0].required = true;
        this.domains = domainsMapped;
      });
    },
    downloadClick() {
      download(JSON.stringify(this.config), "dapper image host.sxcu");
    },
    removeDomainClick(e) {
      this.domains.splice(e.currentTarget.getAttribute("data-index"), 1);
    },
    addDomainClick() {
      this.addDomain();
    }
  },
  computed: {
    config() {
      let obj = {
        Version: "13.1.0",
        DestinationType: "ImageUploader, FileUploader, TextUploader",
        RequestMethod: "POST",
        Parameters: {},
        Headers: {},
        Body: "Binary",
        Name: config.name
      };
      if (this.apiKey) obj.Headers.Authorization = this.apiKey;
      let domain;
      if (this.domains.length > 1) {
        domain = "$json:random$";
        obj.Parameters.random = this.domains.map(d => d.value).join(",");
      } else domain = this.domains[0].value;
      if (domain) {
        obj.RequestURL = `${location.protocol}//${this.domains[0].value}/upload`;
        obj.DeletionURL = `${location.protocol}//${domain}/delete/$json:deletionKey$/$json:name$`;
        obj.URL = ((this.showLink && !this.compatSLoD) ? "\u200C" : "")
            + (this.encryption ? `${location.protocol}//${domain}/$json:encryptionKey$/$json:name$`
                : `${location.protocol}//${domain}/$json:name$`) +
            ((this.showLink && this.compatSLoD) ? "# \u200C" : "");
      }
      if (this.encryption) {
        obj.Parameters.encryption = "yes";
        if (~~this.encKey) {
          obj.Parameters.keyLength = this.encKey;
        } else if (this.encKey) {
          obj.Parameters.encryptionKey = this.encKey;
        }
      }
      if (this.nameLength) {
        obj.Parameters.nameLength = this.nameLength;
      }
      if (this.embed) {
        obj.Parameters.embed = "yes";
        obj.Parameters.embedColor = this.embedColor;
        if (this.embedText) obj.Parameters.embedText = this.embedText;
        if (this.embedTimezone) obj.Parameters.embedTimezone = this.embedTimezone;
        if (this.embedMDY) obj.Parameters.embedMDY = "yes";
      }
      if (this.expire) {
        obj.Parameters.expire = "yes";
        if (this.expireAfter) obj.Parameters.expireAfter = this.expireAfter;
        if (this.expireUses) obj.Parameters.expireUses = this.expireUses;
      }
      return obj;
    },
    json() {
      return JSON.stringify(this.config, null, 2);
    }
  },
  updated() {
    if (this.pendingDomainUpdate) {
      this.pendingDomainUpdate = false;
      this.$refs.domains[this.$refs.domains.length - 1].focus();
    }
  }
};
</script>