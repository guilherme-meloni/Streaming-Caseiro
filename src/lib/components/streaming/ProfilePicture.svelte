<script lang="ts">
  import { profile } from '../../stores/profile';
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  let profilePicture: string | null;
  profile.subscribe(value => {
    profilePicture = value;
  });

  let fileInput: HTMLInputElement;
  let isLoading = false;

  async function handleProfilePictureUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    isLoading = true;

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo inválido. Por favor, use PNG ou JPG.');
      isLoading = false;
      return;
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 2MB.');
      isLoading = false;
      return;
    }

    // Converter para Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      profile.setProfilePicture(base64);
      isLoading = false;
      dispatch('uploadComplete', base64);
    };
    reader.onerror = () => {
      alert('Erro ao ler a imagem.');
      isLoading = false;
    };
    reader.readAsDataURL(file);
  }

  function removeProfilePicture() {
    profile.removeProfilePicture();
    dispatch('removeComplete');
  }

  function triggerFileInput() {
    fileInput.click();
  }
</script>

<div class="profile-picture-container flex flex-col items-center gap-4">
  <div class="relative w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
    {#if profilePicture}
      <img src={profilePicture} alt="Foto de Perfil" class="w-full h-full object-cover" />
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 9a3 3 0 00-3 3v1a3 3 0 003 3h.01a3 3 0 003-3v-1a3 3 0 00-3-3H10zm0-6a3 3 0 100 6 3 3 0 000-6zm-7 9a4 4 0 014-4h6a4 4 0 014 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1z" clip-rule="evenodd" />
      </svg>
    {/if}
    {#if isLoading}
      <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-8 w-8"></div>
      </div>
    {/if}
  </div>

  <input
    type="file"
    accept="image/png, image/jpeg, image/jpg"
    bind:this={fileInput}
    on:change={handleProfilePictureUpload}
    class="hidden"
  />

  <div class="flex gap-2">
    <button
      on:click={triggerFileInput}
      class="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors"
      disabled={isLoading}
    >
      {profilePicture ? 'Trocar Foto' : 'Adicionar Foto'}
    </button>
    {#if profilePicture}
      <button
        on:click={removeProfilePicture}
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        disabled={isLoading}
      >
        Remover Foto
      </button>
    {/if}
  </div>
</div>

<style>
  .loader {
    border-top-color: #3498db; /* Tailwind primary color or similar */
    animation: spinner 1.5s linear infinite;
  }

  @keyframes spinner {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
