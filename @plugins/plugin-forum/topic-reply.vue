<template>
  <div class="topic-reply">
    <factor-loading-ring v-if="loading" />
    <div v-else class="reply-area">
      <div v-if="post.locked" class="no-dice">
        <div class="title">{{ setting('forum.text.topicLocked') }}</div>
      </div>
      <div v-else-if="!currentUser" class="no-dice">
        <div class="title">{{ setting('forum.text.loginToReply') }}</div>
        <div class="actions">
          <factor-link event="sign-in-modal" btn="primary">
            <span v-formatted-text="setting('forum.text.login')" />
          </factor-link>
        </div>
      </div>
      <template v-else>
        <factor-avatar :user="author" />
        <factor-input-editor
          id="topic-reply"
          v-model="reply"
          class="reply-textarea"
          placeholder="Reply"
        />
        <div class="actions save-post">
          <div v-if="showSubscriber && hasSubscribe" class="subscriber">
            <factor-input-checkbox
              v-model="subscriber"
              :label="setting('forum.text.subscribeOnReply')"
            />
          </div>
          <factor-btn v-if="editId" btn="primary" :loading="sending" @click="editReply()">
            <span v-formatted-text="setting('forum.text.save')" />
          </factor-btn>
          <factor-btn v-else btn="primary" :loading="sending" @click="topicReply()">
            <span v-formatted-text="setting('forum.text.postReply')" />
          </factor-btn>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue"
import { stored, storeItem, emitEvent, setting } from "@factor/api"
import { currentUser, userInitialized } from "@factor/user"
import { FactorPost } from "@factor/post/types"
import {
  factorInputEditor,
  factorInputCheckbox,
  factorAvatar,
  factorBtn,
  factorLink,
  factorLoadingRing
} from "@factor/ui"
import { requestSaveTopicReply, requestSaveTopic } from "./request"
export default Vue.extend({
  components: {
    factorInputEditor,
    factorAvatar,
    factorBtn,
    factorLink,
    factorInputCheckbox,
    factorLoadingRing
  },
  props: {
    postId: { type: String, default: "" },
    editId: { type: String, default: "" },
    showSubscriber: { type: Boolean, default: false }
  },
  data() {
    return {
      subscriber: true,
      reply: "",
      sending: false,
      storeKey: this.editId ? this.editId : "post",
      loading: true
    }
  },
  computed: {
    currentUser,
    hasSubscribe() {
      return setting("forum.features.topicSubscribe")
    },
    author(this: any) {
      if (this.editId) {
        const authorID =
          this.post && this.post.author && this.post.author.length > 0
            ? this.post.author[0]
            : ""
        return stored(authorID) || {}
      } else {
        return this.currentUser ? this.currentUser : {}
      }
    },
    post: {
      get(this: any): FactorPost {
        return stored(this.storeKey) || {}
      },
      set(this: any, v: FactorPost): void {
        storeItem(this.storeKey, v)
      }
    },
    embedded: {
      get(this: any): FactorPost {
        return stored("embedded") || {}
      },
      set(this: any, v: FactorPost): void {
        storeItem("embedded", v)
      }
    }
  },
  async mounted() {
    if (this.editId) {
      this.reply = this.post.content
    }

    await userInitialized()

    this.loading = false
  },
  methods: {
    setting,
    async editReply(this: any) {
      this.sending = true
      if (this.postId != this.editId) {
        await requestSaveTopicReply(this.postId, {
          _id: this.editId,
          content: this.reply
        })
        this.post = { ...this.post, content: this.reply }
        emitEvent("highlight-post", this.editId)
      } else {
        await requestSaveTopic({ _id: this.postId, content: this.reply })
      }

      this.sending = false
      this.$emit("done")
    },
    async topicReply(this: any) {
      if (!this.currentUser._id) {
        return
      }
      this.sending = true

      const doc = {
        content: this.reply,
        author: [this.currentUser._id],
        _id: ""
      }

      const result = await requestSaveTopicReply(this.postId, doc, this.subscriber)

      if (result && result._id) {
        const embeddedCount = (this.post.embeddedCount || 0) + 1

        this.embedded.push(result)

        this.post = { ...this.post, embeddedCount }

        emitEvent("highlight-post", result._id)

        this.$emit("done", { subscribed: this.subscriber })

        this.reply = ""
      }

      this.sending = false
    }
  }
})
</script>
<style lang="less">
.topic-reply {
  text-align: left;
  position: relative;
  .no-dice {
    padding: 2rem;
    text-align: center;
    .title {
      font-size: 1.2em;
    }
    .actions {
      margin-top: 2rem;
    }
  }
  .reply-area {
    position: relative;
    .loading-ring-wrap {
      padding: 4em 0;
    }
    textarea {
      padding: 1rem 5rem;
    }
    .editor-input {
      text-align: left;
    }
    .editor-input .CodeMirror {
      padding-left: 5rem;
    }
    .avatar {
      position: absolute;
      z-index: 10;
      width: 3rem;
      top: 4rem;
      left: 1rem;
    }
    .actions.save-post {
      padding: 1rem 0;
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      .checkbox-wrap {
        border-radius: 6px;
        background: var(--color-bg-contrast);
        padding: 0.25rem 1rem;
        font-size: 0.9em;
        font-weight: 700;
        text-transform: uppercase;
        align-items: center;
        display: flex;
        margin-right: 2rem;
        .checkbox-label {
          margin-left: 0.5rem;
          opacity: 0.5;
        }
      }
    }
  }
}
</style>
