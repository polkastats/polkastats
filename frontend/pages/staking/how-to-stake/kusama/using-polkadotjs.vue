<template>
  <div>
    <section>
      <b-container class="main py-5 support-us">
        <h1 class="mb-4">
          {{
            $t('pages.how_to_stake.kusama.polkadotjs.title', {
              networkName: config.name,
            })
          }}
        </h1>
        <b-breadcrumb :items="breadcrumbsItems" />
        <!-- English content -->
        <template v-if="$i18n.locale == 'en'">
          <b-card class="mb-4">
            <p>
              This step by step guide explains how to nominate on
              <a href="https://kusama.network/" target="_blank">Kusama</a> using
              <a href="https://polkadot.js.org/" target="_blank">Polkadot JS</a>
              and
              <a href="https://bit.ly/3g3HG4Q" target="_blank"
                >Polkadot JS Extension</a
              >.
            </p>
            <p>
              <a href="https://kusama.network/" target="_blank">Kusama</a> is
              the "canary" network for
              <a href="https://polkadot.network/" target="_blank">Polkadot</a>.
              It is a separate network with its own native KSM token.
            </p>
            <p>
              The same principles described in this guide apply for Polkadot and
              other Substrate networks, but make sure you double-check which
              network you are performing actions on.
            </p>
            <p>
              Note that Kusama and Polkadot has different token lockup periods
              at nominating, that means the time you need to wait for unbond (7
              days for Kusama and 28 days for Polkadot).
            </p>
            <p>
              For aditional security we will also use Lunie Browser Extension to
              interact with the chain in a secure way.
            </p>
          </b-card>
          <b-card>
            <h2 class="pt-4">Before start</h2>
            <hr class="pb-2" />
            You will need:
            <ul>
              <li>Chrome or Brave browser.</li>
              <li>A Kusama address with some available KSM tokens.</li>
              <li>The address seed phrase.</li>
            </ul>
            <h2 class="pt-4">1. Install Polkadot JS Extension</h2>
            <hr class="pb-2" />
            <p>
              Open
              <a href="https://bit.ly/3g3HG4Q" target="_blank"
                >https://bit.ly/3g3HG4Q</a
              >
              in your browser and install it.
            </p>
            <h2 class="pt-4">
              2. Import your Kusama address in Polkadot JS Extension
            </h2>
            <hr class="pb-2" />
            <ul>
              <li>Open Polkadot JS Extension.</li>
              <li>Click on "Import account with pre-existing seed".</li>
              <li>Enter your seed phrase.</li>
              <li>Add a descriptive name for your account.</li>
              <li>Enter a password for the account and click next.</li>
              <li>Click on "Add the account with the supplied seed".</li>
            </ul>
            <h2 class="pt-4">3. Open Polkadot JS apps</h2>
            <hr class="pb-2" />
            <p>
              Open
              <a href="https://polkadot.js.org/" target="_blank"
                >https://polkadot.js.org/</a
              >
              in your browser and allow access to the extension.
            </p>
            <h2 class="pt-4">4. Connect to Kusama network</h2>
            <hr class="pb-2" />
            <p>
              Click on "Settings" and Select "Kusama (Polkadot Canary, hosted by
              Parity)", then click on "Save & Reload" button.
            </p>
            <h2 class="pt-4">5. Nominate to PolkaStats</h2>
            <hr class="pb-2" />
            <ul>
              <li>On left menu, click on "Staking".</li>
              <li>Click on "Account Actions" tab.</li>
              <li>Click on "+ Nominator" button.</li>
              <li>Select your imported account as Stash and Controller.</li>
              <li>Enter the amount you want to bond and click next.</li>
              <li>
                Disable "Use an automatic selection of the currently most
                profitable validators".
              </li>
              <li>
                Double click on "PolkaStats" to add to Nominated accounts.
              </li>
              <li>Click on "Bond & Nominate" button.</li>
              <li>
                Open Polkadot JS Extension, enter the password and click on
                "Sign the transaction".
              </li>
            </ul>
            <h2 class="pt-4">6. Wait for your nomination to be active</h2>
            <hr class="pb-2" />
            <p>
              Your nomination will be inactive until the next session, so please
              be patient!.
            </p>
          </b-card>
        </template>
        <!-- Spanish content -->
        <template v-if="$i18n.locale == 'es'">
          <b-card class="mb-4">
            <p>
              Esta guía explica paso a paso como nominar en
              <a href="https://kusama.network/" target="_blank">Kusama</a>
              usando
              <a href="https://polkadot.js.org/" target="_blank">Polkadot JS</a>
              y
              <a
                href="https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd?hl=en"
                target="_blank"
                >Polkadot JS Extension</a
              >.
            </p>
            <p>
              <a href="https://kusama.network/" target="_blank">Kusama</a> es la
              red "Canaria" de
              <a href="https://polkadot.network/" target="_blank">Polkadot</a>.
              Es una red separada con su propio token nativo, el KSM.
            </p>
            <p>
              Los mismos principios que se describen en esta guía aplican
              también para Polkadot y otras redes basadas en Substrate,
              asegúrate de comprobar siempre la red a la que te conectas para
              evitar confusiones.
            </p>
            <p>
              Ten en cuenta que Kusama y Polkadot tienen diferentes tiempos de
              bloqueo de fondos a la hora de nominar, esto significa que para
              desvincular los fondos en Kusama se necesita esperar 7 días,
              mientras que para Polkadot necesitas esperar 28 días.
            </p>
            <p>
              Para mayor seguridad también usaremos la extensión del navegador
              de Polkadot JS para interactuar con la cadena de bloques de la
              forma más segura.
            </p>
          </b-card>
          <b-card>
            <h2 class="pt-4">Antes de empezar</h2>
            <hr class="pb-2" />
            Necesitarás:
            <ul class="pt-2">
              <li>Navegador Chrome o Brave.</li>
              <li>Una dirección de Kusama con algunos KSM disponibles.</li>
              <li>La frase semilla con la que se creo la cuenta.</li>
            </ul>
            <h2 class="pt-4">1. Instalar Polkadot JS Extension</h2>
            <hr class="pb-2" />
            <p>
              Abre
              <a href="https://bit.ly/3g3HG4Q" target="_blank"
                >https://bit.ly/3g3HG4Q</a
              >
              en tu navegador e instala la extensión.
            </p>
            <h2 class="pt-4">
              2. Importa tu dirección Kusama en Polkadot JS Extension
            </h2>
            <hr class="pb-2" />
            <ul>
              <li>Abre Polkadot JS Extension.</li>
              <li>Haz clic en "Import account with pre-existing seed".</li>
              <li>Introduce tu seed phrase.</li>
              <li>Añade un nombre descriptivo para tu cuenta.</li>
              <li>
                Introduce una contraseña para tu cuenta y haz clic en next.
              </li>
              <li>Haz clic en "Add the account with the supplied seed".</li>
            </ul>
            <h2 class="pt-4">3. Abre Polkadot JS apps</h2>
            <hr class="pb-2" />
            <p>
              Abre
              <a href="https://polkadot.js.org/" target="_blank"
                >https://polkadot.js.org/</a
              >
              en tu navegador y permite el acceso a la extensión.
            </p>
            <h2 class="pt-4">4. Conecta a la red Kusama</h2>
            <hr class="pb-2" />
            <p>
              Haz clic en "Settings" y selecciona "Kusama (Polkadot Canary,
              hosted by Parity)", después haz clic en "Save & Reload" button.
            </p>
            <h2 class="pt-4">5. Nominar a PolkaStats</h2>
            <hr class="pb-2" />
            <ul>
              <li>En el menú de la izquierda haz clic en "Staking".</li>
              <li>Haz clic en la pestaña "Account Actions".</li>
              <li>Haz clic en el botón "+ Nominator".</li>
              <li>Selecciona tu cuenta como Stash y Controller.</li>
              <li>Introduce la cantidad y haz clic en next.</li>
              <li>
                Desactiva "Use an automatic selection of the currently most
                profitable validators".
              </li>
              <li>
                Haz doble clic en "PolkaStats" para añadirlo a "Nominated
                accounts".
              </li>
              <li>Haz clic en el botón "Bond & Nominate".</li>
              <li>
                Abre Polkadot JS Extension, introduce la contraseña y haz clic
                en "Sign the transaction".
              </li>
            </ul>
            <h2 class="pt-4">6. Espera a que tu nominación esté activa</h2>
            <hr class="pb-2" />
            <p>
              Tu nominación estará inactiva hasta la siguiente sesión, por favor
              ¡se paciente!.
            </p>
          </b-card>
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import commonMixin from '~/mixins/commonMixin.js'
import { config } from '~/frontend.config.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
      breadcrumbsItems: [
        {
          text: this.$t('pages.home.title'),
          href: '/',
        },
        {
          text: this.$t('pages.how_to_stake.title', {
            networkName: config.name,
          }),
          href: '/how-to-stake',
        },
        {
          text: this.$t('pages.how_to_stake.kusama.title', {
            networkName: config.name,
          }),
          href: '/how-to-stake/kusama',
        },
        {
          text: this.$t('pages.how_to_stake.kusama.polkadotjs.title', {
            networkName: config.name,
          }),
          href: '#',
        },
      ],
    }
  },
  head() {
    return {
      title: this.$t('pages.how_to_stake.kusama.polkadotjs.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.how_to_stake.kusama.polkadotjs.head_content'),
        },
      ],
    }
  },
}
</script>
