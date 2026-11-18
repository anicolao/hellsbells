<script lang="ts">
 import {base} from '$app/paths';
 import '../app.css';
 import '../document.css';
 import {page} from '$app/state';
 let {children}=$props();
</script>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><a class="brand" href={base + "/rules.html"}><span class="brand-seal" aria-hidden="true">♬</span><span>HELL’S BELLS<small>EXACT BIDS · FIVE ROUNDS</small></span></a><nav aria-label="Main"><a href={base + "/rules.html"} aria-current={page.url.pathname===base+'/rules.html'?'page':undefined}>The rulebook</a><a href={base + "/gallery/"} aria-current={page.url.pathname.startsWith(base+'/gallery')?'page':undefined}>The components <span aria-hidden="true">↗</span></a></nav></header>
{@render children()}
<footer class="site-footer"><a class="wordmark" href={base + "/rules.html"}>Hell’s Bells</a><p>Rules and components for 3–5 players.</p><a href={base + "/gallery/"}>Explore the components ↗</a></footer>
