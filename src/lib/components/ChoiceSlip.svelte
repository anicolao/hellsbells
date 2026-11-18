<script lang="ts">
  let { value = '2', label = 'MY BID' }: { value?: string; label?: string } = $props();
</script>
<span class="choice-slip"><span>SECRET</span><b>{value}</b><small>{label}</small></span>
<style>
  .choice-slip{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;background:#fff9ee;border:1px solid #c5ae87;padding:20px;width:95px;aspect-ratio:2/3;text-align:center;font-size:.65rem;box-shadow:0 4px 9px #0002}
  b{display:block;font:500 4rem/1.3 'Cormorant Garamond';color:#a53427}
  small{letter-spacing:.1em}
</style>
