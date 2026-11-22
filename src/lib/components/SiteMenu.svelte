<script lang="ts">
 import {browser} from '$app/environment';
 import {base} from '$app/paths';
 import {page} from '$app/state';
 import {afterNavigate} from '$app/navigation';
 let copied=$state(false);
 const roomCode=$derived(browser?page.url.searchParams.get('game'):null);
 async function copyRoom(){try{await navigator.clipboard.writeText(page.url.href);copied=true;}catch{copied=false;}}
 let menu:HTMLElement|undefined=$state(),open=$state(false);
 const links=[{path:'/play/',name:'Play',art:'back-imp'},{path:'/rules.html',name:'The rulebook',art:'back-regular'},{path:'/gallery/',name:'The components',art:'back-minor'},{path:'/gallery/print/',name:'Print & play',art:'back-catchup'}];
 afterNavigate(()=>{menu?.hidePopover();copied=false;});
 function active(path:string){return path==='/gallery/'?page.url.pathname===base+path:page.url.pathname.startsWith(base+path);}
</script>
<button class="menu-logo" popovertarget="site-menu" aria-controls="site-menu" aria-expanded={open} aria-label={open?'Close menu':'Open menu'} title="Hell’s Bells menu"><img src={`${base}/art/ui/logo.webp`} alt=""/></button>
<nav id="site-menu" popover bind:this={menu} aria-label="Main" ontoggle={e=>open=e.newState==='open'}>
 <div class="menu-title"><strong>Hell’s Bells</strong><button onclick={()=>menu?.hidePopover()} aria-label="Close menu">Close</button></div>
 {#each links as link}<a href={base+link.path} aria-current={active(link.path)?'page':undefined} onclick={()=>menu?.hidePopover()}><img src={`${base}/art/cards/${link.art}.webp`} alt=""/><span>{link.name}</span></a>{/each}
 {#if roomCode&&/^[A-F0-9]{8}$/i.test(roomCode)}<button class="room-share" onclick={copyRoom}><img src={`${base}/art/ui/logo.webp`} alt=""/><span aria-live="polite">{copied?'Link copied':'Copy table link'}<small>{roomCode.toUpperCase()}</small></span></button>{/if}
</nav>
<style>
.menu-logo{position:fixed;z-index:400;top:max(6px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));width:48px;height:48px;padding:0;border:0;background:transparent;filter:drop-shadow(0 2px 4px #0007);border-radius:50%}.menu-logo img{display:block;width:100%;height:100%;object-fit:contain}.menu-logo:hover{filter:drop-shadow(0 0 5px #e7bb69)}
nav{position:fixed;inset:max(62px,calc(env(safe-area-inset-top) + 56px)) auto auto max(8px,env(safe-area-inset-left));margin:0;width:min(300px,calc(100vw - 16px));padding:16px;border:1px solid #b59a60;border-radius:8px;background:#1a231ef5;color:#f4e4bf;box-shadow:0 12px 35px #0009;max-height:calc(100dvh - 76px);overflow:auto}nav::backdrop{background:transparent}.menu-title{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 0 12px;border-bottom:1px solid #a68b4b55}.menu-title strong{font:600 1.8rem 'Cormorant Garamond',serif}.menu-title button{background:none;color:#dcc69a;border:1px solid #9c885a;padding:6px 10px;border-radius:4px}nav a,.room-share{display:flex;align-items:center;gap:16px;padding:10px 6px;text-decoration:none;border-radius:4px;min-height:60px}nav a:hover,nav a[aria-current],.room-share:hover{background:#b9944f24;color:#ffe2a0}nav a img,.room-share img{width:30px;height:46px;object-fit:contain}
.room-share{width:100%;background:none;color:inherit;border:0;border-top:1px solid #a68b4b55;text-align:left;font:inherit}.room-share small{display:block;font-size:.65rem;letter-spacing:.1em;margin-top:4px}
@media(max-height:600px){.menu-logo{width:36px;height:36px;top:4px}nav{top:44px;max-height:calc(100dvh - 52px)}}
@media print{.menu-logo,nav{display:none!important}}
</style>
