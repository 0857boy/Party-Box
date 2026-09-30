import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/app/views/HomeView.vue'
import AvalonSetupView from '@/games/avalon/views/AvalonSetupView.vue'
import AvalonRevealView from '@/games/avalon/views/AvalonRevealView.vue'
import AvalonReadyView from '@/games/avalon/views/AvalonReadyView.vue'
import AvalonPlayView from '@/games/avalon/views/AvalonPlayView.vue'
import AvalonResultView from '@/games/avalon/views/AvalonResultView.vue'
import { hasAvalonSession } from '@/games/avalon/stores/session'
import UndercoverSetupView from '@/games/undercover/views/UndercoverSetupView.vue'
import UndercoverRevealView from '@/games/undercover/views/UndercoverRevealView.vue'
import UndercoverPlayView from '@/games/undercover/views/UndercoverPlayView.vue'
import UndercoverResultView from '@/games/undercover/views/UndercoverResultView.vue'
import { hasUndercoverSession } from '@/games/undercover/stores/session'
import CharadesSetupView from '@/games/charades/views/CharadesSetupView.vue'
import CharadesPlayView from '@/games/charades/views/CharadesPlayView.vue'
import CharadesResultView from '@/games/charades/views/CharadesResultView.vue'
import { hasCharadesSession } from '@/games/charades/stores/session'
import FakeArtistSetupView from '@/games/fake-artist/views/FakeArtistSetupView.vue'
import FakeArtistRevealView from '@/games/fake-artist/views/FakeArtistRevealView.vue'
import FakeArtistPlayView from '@/games/fake-artist/views/FakeArtistPlayView.vue'
import FakeArtistResultView from '@/games/fake-artist/views/FakeArtistResultView.vue'
import { hasFakeArtistSession } from '@/games/fake-artist/stores/session'
import WavelengthSetupView from '@/games/wavelength/views/WavelengthSetupView.vue'
import WavelengthPlayView from '@/games/wavelength/views/WavelengthPlayView.vue'
import { hasWavelengthSession } from '@/games/wavelength/stores/session'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/avalon/setup', name: 'avalon-setup', component: AvalonSetupView, meta: { theme: 'avalon' } },
    { path: '/avalon/reveal', name: 'avalon-reveal', component: AvalonRevealView, meta: { theme: 'avalon', requiresSession: true } },
    { path: '/avalon/ready', name: 'avalon-ready', component: AvalonReadyView, meta: { theme: 'avalon', requiresSession: true } },
    { path: '/avalon/play', name: 'avalon-play', component: AvalonPlayView, meta: { theme: 'avalon', requiresSession: true } },
    { path: '/avalon/result', name: 'avalon-result', component: AvalonResultView, meta: { theme: 'avalon', requiresSession: true } },
    { path: '/undercover/setup', name: 'undercover-setup', component: UndercoverSetupView, meta: { theme: 'undercover' } },
    { path: '/undercover/reveal', name: 'undercover-reveal', component: UndercoverRevealView, meta: { theme: 'undercover', requiresUndercoverSession: true } },
    { path: '/undercover/play', name: 'undercover-play', component: UndercoverPlayView, meta: { theme: 'undercover', requiresUndercoverSession: true } },
    { path: '/undercover/result', name: 'undercover-result', component: UndercoverResultView, meta: { theme: 'undercover', requiresUndercoverSession: true } },
    { path: '/charades/setup', name: 'charades-setup', component: CharadesSetupView, meta: { theme: 'charades' } },
    { path: '/charades/play', name: 'charades-play', component: CharadesPlayView, meta: { theme: 'charades', requiresCharadesSession: true } },
    { path: '/charades/result', name: 'charades-result', component: CharadesResultView, meta: { theme: 'charades', requiresCharadesSession: true } },
    { path: '/fake-artist/setup', name: 'fake-artist-setup', component: FakeArtistSetupView, meta: { theme: 'fake-artist' } },
    { path: '/fake-artist/reveal', name: 'fake-artist-reveal', component: FakeArtistRevealView, meta: { theme: 'fake-artist', requiresFakeArtistSession: true } },
    { path: '/fake-artist/play', name: 'fake-artist-play', component: FakeArtistPlayView, meta: { theme: 'fake-artist', requiresFakeArtistSession: true } },
    { path: '/fake-artist/result', name: 'fake-artist-result', component: FakeArtistResultView, meta: { theme: 'fake-artist', requiresFakeArtistSession: true } },
    { path: '/wavelength/setup', name: 'wavelength-setup', component: WavelengthSetupView, meta: { theme: 'wavelength' } },
    { path: '/wavelength/play', name: 'wavelength-play', component: WavelengthPlayView, meta: { theme: 'wavelength', requiresWavelengthSession: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (to.meta.requiresSession && !hasAvalonSession()) return { name: 'avalon-setup' }
  if (to.meta.requiresUndercoverSession && !hasUndercoverSession()) return { name: 'undercover-setup' }
  if (to.meta.requiresCharadesSession && !hasCharadesSession()) return { name: 'charades-setup' }
  if (to.meta.requiresFakeArtistSession && !hasFakeArtistSession()) return { name: 'fake-artist-setup' }
  if (to.meta.requiresWavelengthSession && !hasWavelengthSession()) return { name: 'wavelength-setup' }
})
