<template>
  <div>
    <section>
      <b-container class="main py-5 validator-page">
        <!-- English content -->
        <div v-if="$i18n.locale == 'en'">
          <b-row>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Polkadot validators</h4>
                <p>
                  <Identicon
                    address="15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t"
                    :size="25"
                  />
                  <span>15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t</span>
                </p>
                <p>
                  <Identicon
                    address="13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv"
                    :size="25"
                  />
                  <span>13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/polkadot/" class="btn btn-stake">
                    How to nominate on Polkadot
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Kusama validators</h4>
                <p>
                  <Identicon
                    address="GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY"
                    :size="25"
                  />
                  <span>GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY</span>
                </p>
                <p>
                  <Identicon
                    address="EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA"
                    :size="25"
                  />
                  <span>EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/kusama/" class="btn btn-stake">
                    How to nominate on Kusama
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
          </b-row>

          <h2 class="text-center my-4">Why?</h2>

          <b-row class="pt-4">
            <b-col md="4" class="mb-4">
              <h3>High availability</h3>
              <hr />
              <p>
                To ensure maximum availability and security our validators run
                behind sentry nodes using a private network.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>24/7 moritoring</h3>
              <hr />
              <p>
                We monitor our infrastructure 24/7 using state-of-the-art
                monitoring tools to proactively detect problems.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Daily reward payout</h3>
              <hr />
              <p>
                Nominate to PolkaStats and don't waste your time or funds
                claiming your rewards, we do it for you on a daily basis.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Team</h3>
              <hr />
              <p>
                Passionate web3 developers and sysadmins that are active part of
                the community.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Polkadot Bounty winner</h3>
              <hr />
              <p>
                We strongly believe in the Substrate ecosystem contributing with
                <a target="_blank" href="https://polkastats.io">PolkaStats</a>
                and
                <a target="_blank" href="https://polkapulse.polkastats.io"
                  >PolkaPulse</a
                >
                (3rd prize in
                <a
                  href="https://polkadot.network/build-polkadot-network-launch-bounty-challenges/"
                  target="_blank"
                  >Polkadot Launch Bounty Challenges</a
                >
                / Visualization category).
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Early Polkadot supporter</h3>
              <hr />
              <p>
                We support substrate networks since Alexander testnet, been an
                Polkadot and Substrate community member.
              </p>
            </b-col>
          </b-row>
        </div>
        <!-- Spanish content -->
        <div v-if="$i18n.locale == 'es'">
          <b-row>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Validadores Polkadot</h4>
                <p>
                  <Identicon
                    address="15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t"
                    :size="25"
                  />
                  <span>15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t</span>
                </p>
                <p>
                  <Identicon
                    address="13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv"
                    :size="25"
                  />
                  <span>13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/polkadot/" class="btn btn-stake">
                    How to nominate on Polkadot
                  </nuxt-link>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/polkadot/" class="btn btn-stake">
                    Como nominar en Polkadot
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Validadores Kusama</h4>
                <p>
                  <Identicon
                    address="GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY"
                    :size="25"
                  />
                  <span>GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY</span>
                </p>
                <p>
                  <Identicon
                    address="EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA"
                    :size="25"
                  />
                  <span>EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/kusama/" class="btn btn-stake">
                    Como nominar en Kusama
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
          </b-row>

          <h2 class="text-center my-4">¿Por qué nominar a PolkaStats?</h2>

          <b-row class="pt-4">
            <b-col md="4" class="mb-4">
              <h3>Alta disponibilidad</h3>
              <hr />
              <p>
                Para garantizar la máxima disponibilidad y la seguridad de
                nuestros validadores utilizamos nodos Sentry conectados a través
                de una red privada.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Monitorización 24/7</h3>
              <hr />
              <p>
                Monitorizamos nuestra infraestructura 24/7 usando las mejores
                herramientas de monitorización disponibles en el mercado para
                detectar proactivamente cualquier incidencia.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Pago diario de recompensas</h3>
              <hr />
              <p>
                Nomina a PolkaStats y olvídate de malgastar tu tiempo o fondos
                reclamando tus recompensas, nosotros lo hacemos diariamente por
                ti.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Nuestro equipo</h3>
              <hr />
              <p>
                Nuestro equipo de desarrolladores y administradores de sistemas
                son parte activa de la comunidad web3.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Ganadores Polkadot Bounty</h3>
              <hr />
              <p>
                Creemos firmemente en el ecosistema Substrate contribuyendo con
                <a target="_blank" href="https://polkastats.io">PolkaStats</a>
                y
                <a target="_blank" href="https://polkapulse.polkastats.io"
                  >PolkaPulse</a
                >
                (3er premio en la
                <a
                  href="https://polkadot.network/build-polkadot-network-launch-bounty-challenges/"
                  target="_blank"
                  >Polkadot Launch Bounty Challenge</a
                >
                en la categoría de Visualización).
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Desde el inicio con Polkadot</h3>
              <hr />
              <p>
                Formando parte de Polkadot desde la testnet Alexander, siendo un
                miembro activo de la comunidad Polkadot y Substrate.
              </p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </section>
  </div>
</template>
<script>
import { config } from '@/frontend.config.js'
export default {
  data() {
    return {
      config,
    }
  },
  head() {
    return {
      title: this.$t('pages.polkastats_validator.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.polkastats_validator.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
}
</script>
<style>
.validator-page .clipboard {
  display: inline-block;
}
.validator-page .identicon {
  margin-right: 0.2rem;
  cursor: copy;
}
.validator-page .btn-stake {
  color: white !important;
  background-color: #c51062 !important;
  border-color: #c51062 !important;
  box-shadow: none !important;
}
.validator-page .btn-stake:hover,
.validator-page .btn-stake:active,
.validator-page .btn-stake:visited {
  background-color: #ef1073 !important;
  border-color: #ef1073 !important;
  box-shadow: 0 0 0 0.2rem rgba(239, 16, 115, 0.5) !important;
}
</style>
