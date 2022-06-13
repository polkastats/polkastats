<template>

	<table-component v-if="parsedLogs.length > 0" :items="parsedLogs" :fields="fields" :options="options" class="text-center">
		<template #cell(engine)="data">
			<b-badge variant="i-primary">{{ data.value }}</b-badge>
		</template>

	</table-component>
  <!-- <div v-if="parsedLogs.length > 0">
    <div class="card mt-4 mb-3">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>{{ $t('details.block.index') }}</th>
            <th>{{ $t('details.block.engine') }}</th>
            <th>{{ $t('details.block.data') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in parsedLogs" :key="log.log_index">
            <td>{{ log.log_index }}</td>
            <td>{{ log.engine }}</td>
            <td>{{ log.data }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div> -->
</template>
<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import TableComponent from '@/components/more/TableComponent.vue'

export default {
	components: { TableComponent },
  mixins: [commonMixin],
  props: {
    blockNumber: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: true,
      parsedLogs: [],
	  fields: [
        {
          key: 'log_index',
          label: this.$t('details.block.index'),
          sortable: true,
		  class: 'pkd-marked'
        },
        {
          key: 'engine',
          label: this.$t('details.block.engine'),
          sortable: true,
        },
        {
          key: 'data',
          label: this.$t('details.block.data'),
          sortable: true,
		  class: 'text-left',
		  tdClass: 'text-wrap text-break'
        },
      ],
    }
  },
  computed:
  {
	options()
	{
		return {
			title: this.$t('details.block.logs'),
			variant: 'i-secondary',
		}
	},
  },
  apollo: {
    $subscribe: {
      log: {
        query: gql`
          subscription logs($block_number: bigint!) {
            log(where: { block_number: { _eq: $block_number } }) {
              data
              engine
              log_index
              timestamp
            }
          }
        `,
        variables() {
          return {
            block_number: this.blockNumber,
          }
        },
        result({ data }) {
          this.parsedLogs = data.log
          this.$emit('totalLogs', this.parsedLogs.length)
        },
      },
    },
  },
}
</script>

<style scoped>
td {
  word-break: break-all;
}
</style>
