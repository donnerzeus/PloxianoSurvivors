import { ref, set, push, onDisconnect } from "firebase/database";
import { rtdb } from "./config";

export interface PlayerState {
    id: string;
    username: string;
    characterId: string;
    pos: { x: number, y: number };
    hp: number;
    lvl: number;
    isHost: boolean;
}

export interface RoomState {
    metadata: {
        seed: string;
        status: 'lobby' | 'playing' | 'ended';
        startTime?: number;
    };
    players: Record<string, PlayerState>;
}

export const createRoom = async (username: string, characterId: string) => {
    const roomsRef = ref(rtdb, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;
    const seed = Math.random().toString(36).substring(7);

    const initialState: RoomState = {
        metadata: {
            seed,
            status: 'lobby'
        },
        players: {
            [username]: {
                id: username,
                username,
                characterId,
                pos: { x: 2000, y: 2000 },
                hp: 100,
                lvl: 1,
                isHost: true
            }
        }
    };

    await set(newRoomRef, initialState);
    return roomId;
};

export const joinRoom = async (roomId: string, username: string, characterId: string) => {
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${username}`);
    const state: PlayerState = {
        id: username,
        username,
        characterId,
        pos: { x: 2000, y: 2000 },
        hp: 100,
        lvl: 1,
        isHost: false
    };

    await set(playerRef, state);
    onDisconnect(playerRef).remove();
};
