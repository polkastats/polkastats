<template>
  <div id="footer" class="container-fluid footer mt-4">
    <footer class="text-muted">
      <div class="container">
        <div class="row mt-4 pt-5">
          <div class="col-12 text-center">
            <img
              class="img-fluid"
              src="/img/polkastats_logo_light@2x.png"
              style="max-width: 300px"
            />
          </div>
        </div>
        <div class="row mt-4 pt-5">
          <div
            class="
              col-xs-12 col-sm-12 col-md-4
              mt-2
              mb-4
              pb-4
              mt-sm-2
              text-center text-white
            "
            data-testid="footer-getInContact"
          >
            <h3 class="mb-3">
              {{ $t('layout.default.get_in_contact') }}
            </h3>
            <hr />
            <ul class="list-unstyled social text-center">
              <li class="mr-2" data-testid="footer-twitter">
                <a target="_blank" href="https://twitter.com/polkastats">
                  <font-awesome-icon :icon="['fab', 'twitter']" />
                  @PolkaStats
                </a>
              </li>
              <li class="mr-2" data-testid="footer-pgp">
                <a target="_blank" href="https://keybase.io/encrypt#polkastats">
                  <font-awesome-icon :icon="['fab', 'keybase']" />
                  PGP: 14C5 91D0 8ABA 03B7
                </a>
              </li>
              <li data-testid="footer-email">
                <a target="_blank" href="mailto:polkastats@protonmail.com"
                  ><font-awesome-icon icon="envelope" />
                  polkastats@protonmail.com</a
                >
              </li>
            </ul>
          </div>
          <div
            class="
              col-xs-12 col-sm-12 col-md-4
              mt-2
              mb-4
              pb-4
              mt-sm-2
              text-center text-white
            "
            data-testid="footer-polkadot"
          >
            <h3 class="mb-3">PolkaStats</h3>
            <hr />
            <nuxt-link
              to="/team"
              active-class="nuxt-link-exact-active"
              class="nav-link"
              data-testid="aboutUs"
            >
              {{ $t('layout.default.about_us') }}
            </nuxt-link>
            <nuxt-link
              to="/support-us"
              active-class="nuxt-link-exact-active"
              class="nav-link"
              data-testid="supportPolkastats"
            >
              {{ $t('layout.default.support_polkastats') }}
            </nuxt-link>
          </div>
          <div
            class="
              col-xs-12 col-sm-12 col-md-4
              mt-2
              mb-4
              pb-4
              mt-sm-2
              text-center text-white
            "
            data-testid="footer-builtFor"
          >
            <h3 class="mb-3">
              {{ $t('layout.default.built_with') }}
            </h3>
            <hr />
            <a href="https://web3.foundation/grants/" target="_blank">
              <img
                src="/img/grant_badge.png"
                class="grant-badge"
                alt="Web3 foundation grants program"
              />
            </a>
          </div>
        </div>
        <p
          class="small pt-4 text-center text-white"
          data-testid="footer-bottom"
        >
          <nuxt-link to="/team">
            {{ $t('layout.default.made_by') }}
          </nuxt-link>
          <span class="mx-2">|</span> {{ $t('layout.default.built_with') }}
          <a
            href="https://basicattentiontoken.org/"
            target="_blank"
            data-testid="bat"
            >Basic Atttention Token
            <img src="/img/brave/logo-full-color.png" class="img-fluid bat"
          /></a>
          <span class="mx-2">|</span>
          <a
            href="https://github.com/Colm3na/polkastats-ng"
            aria-label="View source on GitHub"
            title="View source code on GitHub"
            target="_blank"
            data-testid="github"
            ><i class="fab fa-github" />
            {{ $t('layout.default.view_source_code_on_github') }}</a
          >
        </p>
      </div>
    </footer>
  </div>
</template>
<script>
export default {}
</script>
