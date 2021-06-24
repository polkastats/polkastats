<template>
  <div>
    <section>
      <b-container class="main py-5 support-us">
        <h1 class="mb-4">
          {{ $t('pages.support-us.support_polkastats') }}
        </h1>

        <p>
          {{ $t('pages.support-us.polkastats_software_TEXT') }}
        </p>

        <p>
          {{ $t('pages.support-us.i_enjoy_developing_TEXT') }}
        </p>

        <p>
          {{ $t('pages.support-us.if_you_like_TEXT') }}
        </p>

        <h4 class="mt-5 mb-4">
          {{ $t('pages.support-us.feedback') }}
        </h4>

        <p>
          {{ $t('pages.support-us.we_love_feedback_TEXT') }}
          <a href="https://github.com/Colm3na/polkastats-v3" target="_blank">{{
            $t('pages.support-us.github_repository')
          }}</a
          >.
        </p>

        <h4 class="mt-5 mb-4">
          {{ $t('pages.support-us.stake_in_our_validator') }}
        </h4>

        <p>
          {{ $t('pages.support-us.this_is_an_TEXT') }}
        </p>

        <h4 class="mt-5 mb-4">
          {{ $t('pages.support-us.follow_polkastats_on_twitter') }}
        </h4>
        <p>
          {{ $t('pages.support-us.are_you_a_TEXT') }}
          <a target="_blank" href="https://twitter.com/polkastats"
            ><i class="fab fa-twitter" /> @PolkaStats</a
          >
          {{ $t('pages.support-us.on_twitter_to_get_TEXT') }}.
        </p>
      </b-container>
    </section>
  </div>
</template>
<script>
export default {
  head() {
    return {
      title: this.$t('pages.support-us.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.support-us.head_content'),
        },
      ],
    }
  },
}
</script>
