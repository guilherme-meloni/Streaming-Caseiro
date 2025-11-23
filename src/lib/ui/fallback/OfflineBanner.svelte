<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
  // ESTA ALTERAÇÃO É VISUAL
  const handleSupportClick = () => {
    console.info('Contato suporte via WhatsApp clicado');
  };
</script>

<!-- ESTA ALTERAÇÃO É VISUAL -->
<div
  class="fixed top-16 left-0 right-0 z-50 flex flex-col items-center justify-center gap-4 bg-red-800/95 p-4 text-center text-white shadow-2xl backdrop-blur-sm md:flex-row md:text-left"
  role="alert"
>
  <div class="flex items-center gap-3">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-8 w-8 shrink-0 stroke-current"
      fill="none"
      viewBox="0 0 24 24"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      ></path></svg
    >
    <span class="font-semibold">O servidor está instável. Contate o suporte.</span>
  </div>
  <a
    href="https://wa.me/5535997142140?text=ola%20o%20servidor%20esta%20isntavel%20pode%20dar%20uma%20olhada"
    target="_blank"
    rel="noopener noreferrer"
    class="mt-2 shrink-0 rounded-lg bg-white/20 px-5 py-2.5 text-sm font-bold transition-transform hover:bg-white/30 active:scale-95 md:mt-0 md:ml-6"
    on:click={handleSupportClick}
  >
    Contactar suporte
  </a>
</div>
