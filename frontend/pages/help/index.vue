<template>
  <div class="page metrics-page container-fluid py-3">
    <div>
      <h1 class="mb-4">Validator Resource Center Help</h1>
      <p>
        Validator elections are essential for the security of the network, where
        nominators have the important task to evaluate and select the most
        trustworthy and competent validators. However, in reality this task is
        quite challenging and comes with significant effort. The vast amount of
        data on validators (which is constantly increasing) requires a
        substantial technical expertise and engagement. Currently, the process
        is too cumbersome and many nominators are either not staking or avoiding
        spending too much time to go through the large amount of data.
        Therefore, we need to provide tools, which both aid nominators in the
        selection process, while still ensuring that the outcome is beneficial
        for the network. The Validator Resource Center aims to solve those
        problems.
      </p>
      <h2 class="py-4">How it works</h2>
      <h5>1. Connect your extension account</h5>
      <p>
        You can to connect address, authorizing the app on Polkadot JS extension
        and a modal window with a list of Kusama controller accounts is shown.
        You can select one of them and import its current validator set, this is
        later used to compare the current set performance vs network average in
        the Dashboard. This step is optional.
      </p>
      <h5>2. Exclude groups of validators</h5>
      <p>
        You can exclude groups of validators (oversubscribed, without identity,
        etc) based on your preferences (similar to Phase 1). There’s a new
        checkbox (checked by default) to allow only one cluster member to be
        selected per set: You can disable this option manually.
      </p>
      <h5>3. Set your custom metric weights</h5>
      <p>
        You may customize the weights of the VRC score and thereby deviate from
        the default option (equal weight of each metric). We calculate the VRC
        score as a simple weighted sum of the minor metrics. In the case that a
        filter from 1) renders a weight meaningless, it is greyed out (e.g.,
        removing all validators with a slash, then all remaining validators will
        have the same score in the slash metric).
      </p>
      <h5>4. Auto-filter</h5>
      <p>
        Auto-filter of quantitatively dominated validators. Explanation: A
        validator X is dominated by another validator Y if all Y’s
        quantitatively metrics are at least equally good and at least one metric
        is strictly better.
      </p>
      <h5>5. Search</h5>
      <p>
        You can search by address or identity name on the current list of
        validators.
      </p>
      <h5>6. Check your results</h5>
      <p>
        The final table (after filters from step 1 to 4 have been applied) are
        shown. The table contains all major metrics which are of special
        importance in the selection process those include:
      </p>
      <ol>
        <li>Relative performance: normalized performance of each validator</li>
        <li>Self Stake: The amount a validator puts at stake</li>
        <li>
          Active Eras: How long the validator has been continuously active
        </li>
        <li>
          VRC Score: The various minor metrics as combined into one score as
          weighted sum
        </li>
      </ol>
      <h5>7. Order your results</h5>
      <p>
        You may now order the major metrics with regard to their preferences and
        select appropriate validators.
      </p>
      <h5>8. Do your selection</h5>
      <p>
        Select validators by clicking in the hand icon, you can check your
        current selection in the top right Selected validators widget.
      </p>
      <h5>9. Nominate</h5>
      <p>
        You can nominate on-chain your selected validators by clicking on
        Nominate button in the Selected validators widget or in the sidebar
        menu.
      </p>
      <h2 class="py-4">VRC score metrics</h2>
      <p>
        Check the definition of minor metrics included in the Validator Resource
        Center score <nuxt-link to="/help/metrics">here</nuxt-link>
      </p>
    </div>
  </div>
</template>

<script>
export default {}
</script>
