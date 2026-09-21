<template>
  <section
    id="subscribe-band"
    class="bg-dark text-dark-cream"
  >
    <div class="wrap grid gap-7 py-[clamp(56px,8vw,112px)] min-[980px]:grid-cols-[1.1fr_.9fr] min-[980px]:items-center min-[980px]:gap-16 [&>*]:min-w-0">
      <div>
        <p class="eyebrow text-amber-bright">
          Join the list
        </p>
        <h2 class="mt-3.5 max-w-[14ch] text-(length:--fs-band) [&_em]:text-amber-bright">
          Linger over <em>the good seats.</em>
        </h2>
      </div>
      <SubscribeForm variant="dark" />
    </div>
  </section>
</template>
