<template>
  <div>
    <SiteNav />
    <main>
      <slot />
    </main>
    <SiteFooter />
    <div
      class="grain"
      aria-hidden="true"
    />
  </div>
</template>
