<script setup lang="ts">
import { ArrowRight, Download, Sparkles, UsersRound, WifiOff } from '@lucide/vue'
import { gamesRegistry } from '@/app/config/gamesRegistry'
</script>

<template>
  <div class="home-view">
    <header class="home-nav page-container">
      <RouterLink to="/" class="home-brand" aria-label="Party Box 首頁">
        <span class="brand-mark"><span>PB</span></span>
        <span><strong>PARTY BOX</strong><small>PLAY TOGETHER</small></span>
      </RouterLink>
      <span class="local-pill"><WifiOff :size="15" /> 離線也能玩</span>
    </header>

    <section class="hero page-container">
      <div class="hero__content">
        <span class="eyebrow"><Sparkles :size="14" /> YOUR TABLE. YOUR STORY.</span>
        <h1>一部裝置，<br /><em>整桌都是遊戲。</em></h1>
        <p>不需登入、不需下載。把手機放到桌中央，選一款遊戲，就讓今晚開始。</p>
        <div class="hero__meta">
          <span><UsersRound :size="18" /> 3–16 人</span>
          <span><Download :size="18" /> 可安裝 PWA</span>
        </div>
      </div>
      <div class="hero__decks" aria-hidden="true">
        <div class="hero-card hero-card--back"><span>✦</span><small>PARTY BOX</small></div>
        <div class="hero-card hero-card--front"><span>PLAY</span><strong>TOGETHER</strong><small>NO DOWNLOAD · NO LOGIN</small></div>
      </div>
    </section>

    <section class="game-library page-container" aria-labelledby="game-library-title">
      <div class="section-heading">
        <div><span class="eyebrow">CHOOSE YOUR GAME</span><h2 id="game-library-title">今晚玩什麼？</h2></div>
        <span>{{ gamesRegistry.filter((game) => game.available).length }} 款可遊玩</span>
      </div>
      <div class="game-grid">
        <component
          :is="game.available ? 'RouterLink' : 'article'"
          v-for="game in gamesRegistry"
          :key="game.id"
          :to="game.available ? { name: game.routeName } : undefined"
          class="game-tile"
          :class="[`game-tile--${game.id}`, { 'game-tile--disabled': !game.available }]"
        >
          <div class="game-tile__top">
            <span class="game-tile__icon"><component :is="game.icon" :size="29" /></span>
            <span v-if="game.available" class="available-dot">現在可玩</span>
            <span v-else class="soon-pill">COMING SOON</span>
          </div>
          <div class="game-tile__copy">
            <span>{{ game.eyebrow }}</span>
            <h3>{{ game.name }}</h3>
            <p>{{ game.description }}</p>
          </div>
          <div class="game-tile__footer">
            <span>{{ game.minPlayers }}–{{ game.maxPlayers }} 位玩家</span>
            <span v-if="game.available" class="play-link">開始遊戲 <ArrowRight :size="18" /></span>
            <span v-else>{{ game.accent }}</span>
          </div>
        </component>
      </div>
    </section>

    <footer class="home-footer page-container"><span>PARTY BOX</span><p>Local-first party games, made for the table.</p></footer>
  </div>
</template>
