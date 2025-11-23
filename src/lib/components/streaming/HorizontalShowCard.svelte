<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    interface HorizontalShowCardItem {
        id: string;
        title: string;
        posterUrl: string;
        description: string;
        genre?: string;
        type?: 'serie' | 'filme';
    }

    export let item: HorizontalShowCardItem;

    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch('select', item);
    }
</script>

<button type="button" class="w-full text-left group" on:click={handleClick}>
    <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800 shadow-lg">
        <img
            src={item.posterUrl}
            alt={item.title}
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-3">
            <h4 class="text-lg font-semibold text-white truncate">{item.title}</h4>
            <p class="text-sm text-gray-300 truncate">{item.genre}</p>
        </div>
    </div>
</button>