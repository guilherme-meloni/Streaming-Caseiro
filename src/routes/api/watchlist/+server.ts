import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const WATCHLIST_FILE = path.join(process.cwd(), 'data', 'watchlist.csv');

interface WatchlistItem {
    id: string;
    title: string;
    path: string;
}

async function readWatchlist(): Promise<WatchlistItem[]> {
    try {
        const data = await fs.readFile(WATCHLIST_FILE, 'utf-8');
        const lines = data.trim().split('\n');
        if (lines.length === 1 && lines[0] === '') { // Handle empty file
            return [];
        }
        return lines.map(line => {
            const [id, title, itemPath] = line.split(',');
            return { id, title, path: itemPath };
        });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // File does not exist, return empty array
            return [];
        }
        console.error('Error reading watchlist file:', error);
        throw new Error('Failed to read watchlist.');
    }
}

async function writeWatchlist(watchlist: WatchlistItem[]): Promise<void> {
    const data = watchlist.map(item => `${item.id},${item.title},${item.path}`).join('\n');
    await fs.writeFile(WATCHLIST_FILE, data, 'utf-8');
}

export async function GET() {
    try {
        const watchlist = await readWatchlist();
        return json(watchlist);
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const { id, title, path: itemPath } = await request.json();
        if (!id || !title || !itemPath) {
            return json({ error: 'Missing id, title, or path' }, { status: 400 });
        }

        let watchlist = await readWatchlist();
        if (watchlist.some(item => item.id === id)) {
            return json({ error: 'Item already in watchlist' }, { status: 409 });
        }

        watchlist.push({ id, title, path: itemPath });
        await writeWatchlist(watchlist);
        return json({ message: 'Item added to watchlist' }, { status: 201 });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const { id } = await request.json();
        if (!id) {
            return json({ error: 'Missing id' }, { status: 400 });
        }

        let watchlist = await readWatchlist();
        const initialLength = watchlist.length;
        watchlist = watchlist.filter(item => item.id !== id);

        if (watchlist.length === initialLength) {
            return json({ error: 'Item not found in watchlist' }, { status: 404 });
        }

        await writeWatchlist(watchlist);
        return json({ message: 'Item removed from watchlist' }, { status: 200 });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
