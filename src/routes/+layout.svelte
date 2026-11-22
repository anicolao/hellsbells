<script lang="ts">
 import {base} from '$app/paths';
 import '../app.css';
 import '../document.css';
 import SiteMenu from '$lib/components/SiteMenu.svelte';
 let {children}=$props();
</script>
<a class="skip" href="#main">Skip to content</a>
<SiteMenu/>
<div class="site-content">{@render children()}</div>
<footer class="site-footer"><a class="wordmark" href={base + "/rules.html"}>Hell’s Bells</a><p>Rules and components for 3–5 players.</p><a href={base + "/gallery/"}>Explore the components</a></footer>
