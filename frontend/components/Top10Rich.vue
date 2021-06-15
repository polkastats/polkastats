<template>
  <div class="top-10-rich">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="richList">
        <template #cell(account_id)="data">
          <p class="mb-0 d-inline-block">
            <Identicon
              :key="data.item.account_id"
              :address="data.item.account_id"
              :size="20"
            />
            <nuxt-link
              v-b-tooltip.hover
              :to="`/account/${data.item.account_id}`"
              title="Check account information"
            >
              <span v-if="data.item.identity_display">
                {{ data.item.identity_display }}
              </span>
              <span v-else>
                {{ shortAddress(data.item.account_id) }}
              </span>
            </nuxt-link>
          </p>
        </template>
        <template #cell(free_balance)="data">
          <p class="mb-0">{{ formatAmount(data.item.free_balance) }}</p>
        </template>
        <template #cell(nonce)="data">
          <p class="mb-0">{{ data.item.nonce }}</p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'

export default {
  components: {
    Identicon,
  },
  mixins: [commonMixin],
  data() {
    return {
      richList: [],
      fields: [
        {
          key: 'account_id',
          label: 'Account',
          sortable: true,
        },
        {
          key: 'free_balance',
          label: 'Balance',
          sortable: true,
        },
        {
          key: 'nonce',
          label: 'Transactions',
          class: 'd-none d-sm-none d-md-none d-lg-block d-xl-block',
          sortable: true,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      account: {
        query: gql`
          subscription accounts {
            account(order_by: { free_balance: desc }, where: {}, limit: 10) {
              account_id
              identity_display
              free_balance
              nonce
            }
          }
        `,
        result({ data }) {
          this.richList = data.account
        },
      },
    },
  },
}
</script>

<style>
.top-10-rich .table th,
.top-10-rich .table td {
  padding: 0.45rem;
}
.top-10-rich .table thead th {
  border-bottom: 0;
}
.top-10-rich .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>
