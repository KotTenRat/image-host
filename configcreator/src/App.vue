<template>
  <div class="container">
    <p>
      <input type="text" v-model="apiKey" placeholder="API Key" :class="apiKey ? '' : 'bad'"
      @keydown.space.prevent="">
    </p>
    <p v-if="apiKey" v-for="domain of domains">
      <input ref="domains" type="text" v-model="domain.value" placeholder="Domain"
             @keydown.enter.passive="domainKeypress" :class="(!domain.value && domain.required) ? 'bad' : ''"
      @keydown.space.prevent="">
    </p>
    <p v-if="domains[0].value">
      <label>
        <input type="checkbox" v-model="encryption" style="margin-top: 3vh;">Encryption
      </label>
    </p>
    <p v-if="encryption">
      <input type="text" v-model="encKey" placeholder="Key / Key Length" @keydown="keyLengthKeypress"
      @keydown.space.prevent="">
    </p>
    <p v-if="domains[0].value">
      <label>
        <input type="checkbox" v-model="embed" style="margin-top: 3vh;">Embed
      </label>
    </p>
    <p v-if="embed">
      <label>
        <input type="color" v-model="embedColor">Embed Color
      </label>
    </p>
    <p v-if="embed">
      <input type="text" placeholder="Embed Text" v-model="embedText" @keydown="embedTextKeydown">
    </p>
    <p v-if="embed">
      <input type="text" placeholder="Timezone" v-model="embedTimezone" @keydown="embedTimezoneKeydown">
    </p>
    <p v-if="domains[0].value && false">
      <label>
        <input type="checkbox" v-model="expire" style="margin-top: 3vh;">Expire
      </label>
    </p>
    <p v-if="expire">
      <input type="text" v-model="expireUses" placeholder="Uses before expire" :class="(!expireAfter && !expireUses) ? 'bad' : ''" @keydown="expireUsesKeydown">
    </p>
    <p v-if="expire">
      <input type="text" v-model="expireAfter" placeholder="MS before expire" :class="(!expireAfter && !expireUses) ? 'bad' : ''" @keydown="expireAfterKeydown">
    </p>
    <p v-if="domains[0].value">
      <label>
        <input type="checkbox" v-model="showLink" style="margin-top: 3vh;">Show Link on Discord
      </label>
    </p>
    <p v-if="showLink">
      <label>
        <input type="checkbox" v-model="compatSLoD" style="margin-top: 3vh;">Compatibility SLoD
      </label>
    </p>
    <p v-if="domains[0].value">
      <input type="text" v-model="nameLength" @keydown="nameLengthKeypress" placeholder="Name Length" :class="nameLengthBad ? 'bad' : ''"
      @keydown.space.prevent="">
    </p>
    <pre v-highlightjs="json" style="margin-top: 10vh;">
      <code class="json"></code>
    </pre>
  </div>
</template>

<script>
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
    expire: false,
    expireUses: "",
    expireAfter: "",
    showLink: false,
    compatSLoD: false,
    embedTimezone: ""
  }),
  methods: {
    domainKeypress(e) {
      if (e.currentTarget.value) {
        this.domains.push({
          value: "",
          required: false
        });
        this.pendingDomainUpdate = true;
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
    }
  },
  computed: {
    json() {
      let obj = {
        Version: "13.1.0",
        DestinationType: "ImageUploader, FileUploader, TextUploader",
        RequestMethod: "POST",
        Parameters: {},
        Headers: {},
        Body: "Binary",
        Name: "Dapper image host"
      };
      if (this.apiKey) obj.Headers.Authorization = this.apiKey;
      let domain;
      if (this.domains.length > 1) {
        domain = "$json:random$";
        obj.Parameters.random = this.domains.map(d => d.value).join(",");
      } else domain = this.domains[0].value;
      if (domain) {
        obj.RequestURL = `https://${this.domains[0].value}/upload`;
        obj.DeletionURL = `https://${domain}/delete/$json:deletionKey$/$json:name$`;
        obj.URL = ((this.showLink && !this.compatSLoD) ? "\u200C" : "")
            + (this.encryption ? `https://${domain}/$json:encryptionKey$/$json:name$`
                : `https://${domain}/$json:name$`) +
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
      }
      if (this.expire) {
        obj.Parameters.expire = "yes";
        if (this.expireAfter) obj.Parameters.expireAfter = this.expireAfter;
        if (this.expireUses) obj.Parameters.expireUses = this.expireUses;
      }
      return JSON.stringify(obj, null, 2);
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