import axios from "axios";

const PY_API = "http://127.0.0.1:5000/api";

export async function getFlaskFeed(sort = "latest", page = 1, limit = 24) {
    try {
        const { data } = await axios.get(`${PY_API}/manga`, {
            params: { sort, page, limit },
        });
        return data.items ?? [];
    } catch (err) {
        console.log("❌ getFlaskFeed:", err.message);
        return [];
    }
}

export async function getFlaskDetail(id) {
    try {
        const { data } = await axios.get(`${PY_API}/manga/${id}`);
        return data;
    } catch (err) {
        console.log("❌ getFlaskDetail:", err.message);
        return null;
    }
}

export async function getFlaskChapters(id) {
    try {
        const { data } = await axios.get(`${PY_API}/manga/${id}/chapters`);
        return data;
    } catch (err) {
        console.log("❌ getFlaskChapters:", err.message);
        return [];
    }
}

export async function getFlaskPages(chapterId) {
    try {
        const { data } = await axios.get(`${PY_API}/manga/${chapterId}/pages`);
        return data;
    } catch (err) {
        console.log("❌ getFlaskPages:", err.message);
        return { pages: [] };
    }
}
