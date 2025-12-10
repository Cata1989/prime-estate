import Pusher from 'pusher-js';

let pusherClient;

export function getPusherClient() {
    if (!pusherClient) {
        console.log('Creating Pusher client with key:', process.env.NEXT_PUBLIC_PUSHER_KEY);
        pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });
    }
    return pusherClient;
}