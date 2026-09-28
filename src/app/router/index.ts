import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/app/views/HomeView.vue'
import AvalonSetupView from '@/games/avalon/views/AvalonSetupView.vue'
import AvalonRevealView from '@/games/avalon/views/AvalonRevealView.vue'
import AvalonReadyView from '@/games/avalon/views/AvalonReadyView.vue'
import { hasAvalonSession } from '@/games/avalon/stores/session'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/avalon/setup', name: 'avalon-setup', component: AvalonSetupView, meta: { theme: 'avalon' } },
    { path: '/avalon/reveal', name: 'avalon-reveal', component: AvalonRevealView, meta: { theme: 'avalon', requiresSession: true } },
    { path: '/avalon/ready', name: 'avalon-ready', component: AvalonReadyView, meta: { theme: 'avalon', requiresSession: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (to.meta.requiresSession && !hasAvalonSession()) return { name: 'avalon-setup' }
})
