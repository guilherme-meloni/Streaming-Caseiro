<!-- src/lib/components/streaming/Hero.svelte -->
<script lang="ts">
    import { Play } from 'lucide-svelte';
    import { goto } from '$app/navigation';

    // Define a specific interface for the item prop in Hero
    interface HeroItem {
        id: string;
        title: string;
        posterUrl: string; // Already processed with fallback in Hub
        bannerUrl: string; // Already processed with fallback in Hub
        description: string;
        genre?: string;
        type?: 'serie' | 'filme';
    }

    export let item: HeroItem;
</script>

<section class="relative h-[60vh] sm:h-[80vh] w-full flex items-end p-4 sm:p-8">
    <div class="absolute inset-0">
        <img src={item.bannerUrl} alt={item.title} class="w-full h-full object-cover">
        <div class="absolute inset-0 hero-gradient"></div>
    </div>
    <div class="relative z-5">
        <h2 class="text-4xl sm:text-6xl font-bold">{item.title}</h2>
        <p class="max-w-xl mt-2 text-gray-300">{item.description}</p>
        <div class="mt-4 flex space-x-3">
            <button
                on:click={() => goto(`/player?play=${item.id}&showCode=${item.id}`)}
                class="bg-white text-black font-bold py-2 px-6 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition"
            >
                <Play class="h-6 w-6" />
                <span>Assistir</span>
            </button>
            <button class="bg-gray-700/50 backdrop-blur-sm text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600/60 transition">
                Minha Lista
            </button>
        </div>
    </div>
</section>